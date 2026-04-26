import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { FcmService } from '../notifications/fcm.service';
import { DevicesService } from '../devices/devices.service';

interface AuthSocket extends Socket {
  user: { id: string; username: string; displayName: string; role: string };
}

const MSG_INCLUDE = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  replyTo: {
    include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
  },
  reactions: { select: { emoji: true, userId: true } },
};

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class OnyxGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // ── Per-instance in-memory state ─────────────────────────────────────────────
  // NOTE: For multi-instance deployments, move these to Redis HASH/SET.
  // With the Redis Socket.IO adapter, broadcast/emit still works across instances,
  // but the Maps below are local — adequate for Railway's single-instance plan.
  private onlineUsers  = new Map<string, Set<string>>();   // userId → Set<socketId>
  private voiceRooms   = new Map<string, Map<string, string>>(); // channelId → Map<userId, socketId>
  private typingState  = new Map<string, Map<string, { displayName: string; timer: NodeJS.Timeout }>>();

  // ── Rate limiter: max 10 messages per 5 seconds per socket ───────────────────
  private msgRateMap = new Map<string, { count: number; resetAt: number }>();

  private isRateLimited(socketId: string): boolean {
    const now    = Date.now();
    const WINDOW = 5_000; // 5 s
    const LIMIT  = 10;    // messages per window
    const entry  = this.msgRateMap.get(socketId);
    if (!entry || now > entry.resetAt) {
      this.msgRateMap.set(socketId, { count: 1, resetAt: now + WINDOW });
      return false;
    }
    entry.count++;
    return entry.count > LIMIT;
  }

  // ── Throttle: one typing:update broadcast per channel per 100 ms ─────────────
  private typingThrottle = new Map<string, NodeJS.Timeout>();

  // ── Debounce: presence:update batched per tick to avoid N broadcasts on mass joins
  private pendingPresence: { userId: string; online: boolean }[] = [];
  private presenceFlushTimer: NodeJS.Timeout | null = null;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
    private fcm: FcmService,
    private devices: DevicesService,
  ) {}

  // ── Auth middleware ───────────────────────────────────────────────────────────
  afterInit(server: Server) {
    server.use(async (socket: any, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) return next(new Error('Authentication required'));

        const payload = this.jwtService.verify(token, {
          secret: this.config.get<string>('JWT_SECRET'),
        });
        const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
        if (!user) return next(new Error('User not found'));

        socket.user = { id: user.id, username: user.username, displayName: user.displayName, role: user.role };
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });
  }

  // ── Connection lifecycle ──────────────────────────────────────────────────────
  handleConnection(client: AuthSocket) {
    const { id, displayName } = client.user;

    if (!this.onlineUsers.has(id)) this.onlineUsers.set(id, new Set());
    const wasOffline = this.onlineUsers.get(id)!.size === 0;
    this.onlineUsers.get(id)!.add(client.id);

    if (wasOffline) this.schedulePresenceFlush(id, true);

    // Send current presence snapshot only to the new client
    const onlineIds = [...this.onlineUsers.entries()]
      .filter(([, s]) => s.size > 0)
      .map(([uid]) => uid);
    client.emit('presence:init', { onlineUserIds: onlineIds });
  }

  handleDisconnect(client: AuthSocket) {
    if (!client.user) return;
    const { id } = client.user;

    if (this.onlineUsers.has(id)) {
      this.onlineUsers.get(id)!.delete(client.id);
      if (this.onlineUsers.get(id)!.size === 0) {
        this.onlineUsers.delete(id);
        this.schedulePresenceFlush(id, false);
      }
    }

    // Clean up voice rooms
    for (const [channelId, room] of this.voiceRooms.entries()) {
      if (room.has(id)) {
        room.delete(id);
        client.to(`voice:${channelId}`).emit('voice:peer_left', { channelId, peerId: id });
        if (room.size === 0) this.voiceRooms.delete(channelId);
      }
    }

    // Clean up typing state
    for (const [channelId, typers] of this.typingState.entries()) {
      if (typers.has(id)) {
        clearTimeout(typers.get(id)!.timer);
        typers.delete(id);
        this.broadcastTypingThrottled(channelId);
      }
    }
  }

  // ── Presence batching: collect N connect/disconnects and flush in one broadcast ─
  private schedulePresenceFlush(userId: string, online: boolean) {
    // Remove any earlier pending entry for this user (last one wins)
    this.pendingPresence = this.pendingPresence.filter((p) => p.userId !== userId);
    this.pendingPresence.push({ userId, online });

    if (!this.presenceFlushTimer) {
      this.presenceFlushTimer = setTimeout(() => {
        const batch = this.pendingPresence.splice(0);
        for (const p of batch) {
          this.server.emit('presence:update', { userId: p.userId, online: p.online });
        }
        this.presenceFlushTimer = null;
      }, 200); // flush up to 200ms of join bursts in one pass
    }
  }

  // ── Channel events ────────────────────────────────────────────────────────────
  @SubscribeMessage('channel:join')
  handleChannelJoin(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { channelId: string }) {
    client.join(`channel:${data.channelId}`);
  }

  @SubscribeMessage('channel:leave')
  handleChannelLeave(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { channelId: string }) {
    client.leave(`channel:${data.channelId}`);
  }

  // ── Messages ──────────────────────────────────────────────────────────────────
  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { channelId: string; content: string; replyToId?: string },
  ) {
    const content = data.content?.trim();
    if (!content) return;
    if (content.length > 2000) return; // enforce server-side limit
    if (this.isRateLimited(client.id)) return; // rate limit: 10 msg / 5s

    // Validate replyToId belongs to the SAME channel (prevent cross-channel leakage)
    if (data.replyToId) {
      const reply = await this.prisma.message.findUnique({
        where: { id: data.replyToId },
        select: { channelId: true },
      });
      if (!reply || reply.channelId !== data.channelId) return;
    }

    const message = await this.prisma.message.create({
      data: {
        content,
        channelId: data.channelId,
        authorId: client.user.id,
        ...(data.replyToId ? { replyToId: data.replyToId } : {}),
      },
      include: MSG_INCLUDE,
    });

    this.server.to(`channel:${data.channelId}`).emit('message:new', { message });
    this.stopTyping(data.channelId, client.user.id);

    // ── Push notifications — send to all users except sender ─────────────────
    this.sendPushForMessage(message, data.channelId, client.user).catch(() => {});

    // ── Parse and dispatch @mentions ─────────────────────────────────────────
    await this.dispatchMentions(content, data.channelId, message.id, client.user);
  }

  private async dispatchMentions(
    content: string,
    channelId: string,
    messageId: string,
    sender: AuthSocket['user'],
  ) {
    const mentionRE = /@(everyone|\w+)/gi;
    const names = [...new Set([...content.matchAll(mentionRE)].map((m) => m[1].toLowerCase()))];
    if (!names.length) return;

    const preview = content.length > 80 ? content.slice(0, 80) + '…' : content;

    for (const name of names) {
      if (name === 'everyone') {
        // Broadcast to everyone in the channel EXCEPT the sender
        this.server.to(`channel:${channelId}`).except(
          [...(this.onlineUsers.get(sender.id) ?? [])],
        ).emit('mention:notification', {
          messageId, channelId, isEveryone: true,
          fromUser: { displayName: sender.displayName },
          content: preview,
        });
        return; // @everyone supersedes individual mentions
      }

      // Individual mention — look up by displayName (case-insensitive)
      const target = await this.prisma.user.findFirst({
        where: { displayName: { equals: name, mode: 'insensitive' } },
        select: { id: true },
      });
      if (!target || target.id === sender.id) continue; // skip self-mention

      const sockets = this.onlineUsers.get(target.id);
      if (!sockets?.size) continue;

      for (const socketId of sockets) {
        this.server.to(socketId).emit('mention:notification', {
          messageId, channelId, isEveryone: false,
          fromUser: { displayName: sender.displayName },
          content: preview,
        });
      }
    }
  }

  @SubscribeMessage('message:delete')
  async handleMessageDelete(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { messageId: string },
  ) {
    const message = await this.prisma.message.findUnique({ where: { id: data.messageId } });
    if (!message) return;
    if (client.user.role !== 'ADMIN' && message.authorId !== client.user.id) return;

    await this.prisma.message.update({
      where: { id: data.messageId },
      data: { deleted: true, content: '' },
    });

    this.server
      .to(`channel:${message.channelId}`)
      .emit('message:deleted', { messageId: data.messageId, channelId: message.channelId });
  }

  @SubscribeMessage('message:pin')
  async handleMessagePin(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { messageId: string },
  ) {
    if (client.user.role !== 'ADMIN') return; // admins only

    const existing = await this.prisma.message.findUnique({
      where: { id: data.messageId },
    });
    if (!existing || existing.deleted) return;

    const updated = await this.prisma.message.update({
      where: { id: data.messageId },
      data: { pinned: !existing.pinned },
      include: MSG_INCLUDE,
    });

    // Broadcast updated message so clients refresh pinned indicator
    this.server
      .to(`channel:${existing.channelId}`)
      .emit('message:updated', { message: updated });

    // If newly pinned, also emit an event to insert a system row in chat
    if (updated.pinned) {
      this.server.to(`channel:${existing.channelId}`).emit('message:pinned', {
        messageId: updated.id,
        channelId: updated.channelId,
        pinnedBy: { id: client.user.id, displayName: client.user.displayName },
        pinned: true,
      });
    }
  }

  // ── Typing ────────────────────────────────────────────────────────────────────
  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { channelId: string }) {
    const { channelId } = data;
    if (!this.typingState.has(channelId)) this.typingState.set(channelId, new Map());

    const typers = this.typingState.get(channelId)!;
    if (typers.has(client.user.id)) clearTimeout(typers.get(client.user.id)!.timer);

    const timer = setTimeout(() => this.stopTyping(channelId, client.user.id), 10_000);
    typers.set(client.user.id, { displayName: client.user.displayName, timer });

    this.broadcastTypingThrottled(channelId);
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { channelId: string }) {
    this.stopTyping(data.channelId, client.user.id);
  }

  // ── Reactions ─────────────────────────────────────────────────────────────────
  private static readonly ALLOWED_REACTIONS = ['😂', '💀', '😢', '❤️', '👍'];

  @SubscribeMessage('reaction:toggle')
  async handleReactionToggle(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { messageId: string; emoji: string },
  ) {
    if (!OnyxGateway.ALLOWED_REACTIONS.includes(data.emoji)) return;

    const where = {
      messageId_userId_emoji: { messageId: data.messageId, userId: client.user.id, emoji: data.emoji },
    };

    const existing = await this.prisma.messageReaction.findUnique({ where });
    if (existing) {
      await this.prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.messageReaction.create({
        data: { messageId: data.messageId, userId: client.user.id, emoji: data.emoji },
      });
    }

    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
      include: { reactions: { select: { emoji: true, userId: true } } },
    });
    if (!message) return;

    this.server.to(`channel:${message.channelId}`).emit('reaction:updated', {
      messageId: data.messageId,
      channelId: message.channelId,
      reactions: message.reactions,
    });
  }

  // ── Voice ─────────────────────────────────────────────────────────────────────
  @SubscribeMessage('voice:join')
  async handleVoiceJoin(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { channelId: string }) {
    const { channelId } = data;

    // Validate this is actually a VOICE channel
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { type: true },
    });
    if (!channel || channel.type !== 'VOICE') return;

    if (!this.voiceRooms.has(channelId)) this.voiceRooms.set(channelId, new Map());
    const room = this.voiceRooms.get(channelId)!;

    const peerIds   = [...room.keys()];
    const peerUsers = await this.prisma.user.findMany({
      where: { id: { in: peerIds } },
      select: { id: true, displayName: true },
    });

    client.join(`voice:${channelId}`);
    room.set(client.user.id, client.id);

    client.emit('voice:peers', {
      channelId,
      peers: peerUsers.map((u) => ({ id: u.id, displayName: u.displayName, isMuted: false })),
    });
    client.to(`voice:${channelId}`).emit('voice:peer_joined', {
      channelId,
      peer: { id: client.user.id, displayName: client.user.displayName },
    });
  }

  @SubscribeMessage('voice:leave')
  handleVoiceLeave(@ConnectedSocket() client: AuthSocket, @MessageBody() data: { channelId: string }) {
    const { channelId } = data;
    if (this.voiceRooms.has(channelId)) {
      this.voiceRooms.get(channelId)!.delete(client.user.id);
      if (this.voiceRooms.get(channelId)!.size === 0) this.voiceRooms.delete(channelId);
    }
    client.leave(`voice:${channelId}`);
    client.to(`voice:${channelId}`).emit('voice:peer_left', { channelId, peerId: client.user.id });
  }

  @SubscribeMessage('voice:signal')
  handleVoiceSignal(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { type: string; to: string; channelId: string; data: unknown },
  ) {
    const room = this.voiceRooms.get(data.channelId);
    if (!room) return;
    const targetSocketId = room.get(data.to);
    if (!targetSocketId) return;
    this.server.to(targetSocketId).emit('voice:signal', { type: data.type, from: client.user.id, data: data.data });
  }

  // ── Admin helper ──────────────────────────────────────────────────────────────
  broadcastChannelUpdate(channels: any[]) {
    this.server.emit('channels:updated', { channels });
  }

  // ── Private helpers ───────────────────────────────────────────────────────────
  private stopTyping(channelId: string, userId: string) {
    const typers = this.typingState.get(channelId);
    if (!typers?.has(userId)) return;
    clearTimeout(typers.get(userId)!.timer);
    typers.delete(userId);
    this.broadcastTypingThrottled(channelId);
  }

  /** Throttled typing broadcast: max 1 emit per channel per 100 ms.
   *  Reduces the perceived delay before other clients see the indicator. */
  private broadcastTypingThrottled(channelId: string) {
    if (this.typingThrottle.has(channelId)) return; // already scheduled
    this.typingThrottle.set(
      channelId,
      setTimeout(() => {
        this.typingThrottle.delete(channelId);
        this.emitTyping(channelId);
      }, 100),
    );
  }

  private emitTyping(channelId: string) {
    const typers = this.typingState.get(channelId) ?? new Map();
    const users = [...typers.entries()].map(([id, { displayName }]) => ({ id, displayName }));
    this.server.to(`channel:${channelId}`).emit('typing:update', { channelId, users });
  }

  // ── FCM push for new messages ─────────────────────────────────────────────────
  private async sendPushForMessage(
    message: { id: string; content: string; author: { id: string; displayName: string } },
    channelId: string,
    sender: AuthSocket['user'],
  ): Promise<void> {
    // Get channel name for the notification title
    const channel = await this.prisma.channel.findUnique({
      where:  { id: channelId },
      select: { name: true },
    });
    if (!channel) return;

    // Exclude: sender + any user currently connected via WebSocket.
    // Online users receive the message in real-time via socket — no push needed.
    const excludedUserIds = [...new Set([sender.id, ...this.onlineUsers.keys()])];
    const tokens = await this.devices.getTokensExcluding(excludedUserIds);
    if (tokens.length === 0) return;

    const preview = message.content.length > 100
      ? message.content.slice(0, 100) + '…'
      : message.content;

    await this.fcm.sendMulticast(
      tokens,
      `#${channel.name}`,
      `${sender.displayName}: ${preview}`,
      { channelId, messageId: message.id },
    );
  }
}
