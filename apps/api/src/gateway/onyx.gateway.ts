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
import { WsEvents } from '@onyx/types';

interface AuthSocket extends Socket {
  user: { id: string; username: string; displayName: string; role: string };
}

const MSG_INCLUDE = {
  author: { select: { id: true, username: true, displayName: true } },
  replyTo: {
    include: { author: { select: { id: true, username: true, displayName: true } } },
  },
};

@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket', 'polling'],
})
export class OnyxGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Presence: userId → Set<socketId>
  private onlineUsers = new Map<string, Set<string>>();

  // Voice rooms: channelId → Map<userId, socketId>
  private voiceRooms = new Map<string, Map<string, string>>();

  // Typing: channelId → Map<userId, { displayName, timer }>
  private typingState = new Map<string, Map<string, { displayName: string; timer: NodeJS.Timeout }>>();

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    // Socket-level JWT auth middleware
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

        socket.user = {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role,
        };
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });
  }

  handleConnection(client: AuthSocket) {
    const { id, displayName } = client.user;

    if (!this.onlineUsers.has(id)) this.onlineUsers.set(id, new Set());
    const wasOffline = this.onlineUsers.get(id).size === 0;
    this.onlineUsers.get(id).add(client.id);

    if (wasOffline) {
      this.server.emit('presence:update', { userId: id, online: true } satisfies WsEvents.PresenceUpdate);
    }

    // Send current online list to the new client
    const onlineUserIds = [...this.onlineUsers.entries()]
      .filter(([, s]) => s.size > 0)
      .map(([uid]) => uid);
    client.emit('presence:init', { onlineUserIds } satisfies WsEvents.PresenceInit);

    console.log(`[WS] Connected: @${client.user.username} (${client.id})`);
  }

  handleDisconnect(client: AuthSocket) {
    if (!client.user) return;
    const { id } = client.user;

    // Presence
    if (this.onlineUsers.has(id)) {
      this.onlineUsers.get(id).delete(client.id);
      if (this.onlineUsers.get(id).size === 0) {
        this.onlineUsers.delete(id);
        this.server.emit('presence:update', { userId: id, online: false } satisfies WsEvents.PresenceUpdate);
      }
    }

    // Voice cleanup
    for (const [channelId, room] of this.voiceRooms.entries()) {
      if (room.has(id)) {
        room.delete(id);
        client.to(`voice:${channelId}`).emit('voice:peer_left', { channelId, peerId: id } satisfies WsEvents.VoicePeerLeft);
        if (room.size === 0) this.voiceRooms.delete(channelId);
      }
    }

    // Typing cleanup
    for (const [channelId, typers] of this.typingState.entries()) {
      if (typers.has(id)) {
        clearTimeout(typers.get(id).timer);
        typers.delete(id);
        this.broadcastTyping(channelId);
      }
    }

    console.log(`[WS] Disconnected: @${client.user.username}`);
  }

  // ─── Channel Rooms ─────────────────────────────────────────────────────────

  @SubscribeMessage('channel:join')
  handleChannelJoin(@ConnectedSocket() client: AuthSocket, @MessageBody() data: WsEvents.ChannelJoin) {
    client.join(`channel:${data.channelId}`);
  }

  @SubscribeMessage('channel:leave')
  handleChannelLeave(@ConnectedSocket() client: AuthSocket, @MessageBody() data: WsEvents.ChannelLeave) {
    client.leave(`channel:${data.channelId}`);
  }

  // ─── Messaging ─────────────────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleMessageSend(@ConnectedSocket() client: AuthSocket, @MessageBody() data: WsEvents.MessageSend) {
    if (!data.content?.trim()) return;

    const message = await this.prisma.message.create({
      data: {
        content: data.content.trim(),
        channelId: data.channelId,
        authorId: client.user.id,
        ...(data.replyToId ? { replyToId: data.replyToId } : {}),
      },
      include: MSG_INCLUDE,
    });

    this.server.to(`channel:${data.channelId}`).emit('message:new', { message } satisfies WsEvents.MessageNew);
    this.stopTyping(data.channelId, client.user.id);
  }

  @SubscribeMessage('message:delete')
  async handleMessageDelete(@ConnectedSocket() client: AuthSocket, @MessageBody() data: WsEvents.MessageDelete) {
    const message = await this.prisma.message.findUnique({ where: { id: data.messageId } });
    if (!message) return;
    if (client.user.role !== 'ADMIN' && message.authorId !== client.user.id) return;

    await this.prisma.message.update({
      where: { id: data.messageId },
      data: { deleted: true, content: '' },
    });

    this.server
      .to(`channel:${message.channelId}`)
      .emit('message:deleted', { messageId: data.messageId, channelId: message.channelId } satisfies WsEvents.MessageDeleted);
  }

  // ─── Typing Indicators ──────────────────────────────────────────────────────

  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: AuthSocket, @MessageBody() data: WsEvents.TypingStart) {
    const { channelId } = data;
    if (!this.typingState.has(channelId)) this.typingState.set(channelId, new Map());

    const typers = this.typingState.get(channelId);
    if (typers.has(client.user.id)) clearTimeout(typers.get(client.user.id).timer);

    const timer = setTimeout(() => this.stopTyping(channelId, client.user.id), 5000);
    typers.set(client.user.id, { displayName: client.user.displayName, timer });
    this.broadcastTyping(channelId);
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: AuthSocket, @MessageBody() data: WsEvents.TypingStop) {
    this.stopTyping(data.channelId, client.user.id);
  }

  // ─── Voice / WebRTC ────────────────────────────────────────────────────────

  @SubscribeMessage('voice:join')
  async handleVoiceJoin(@ConnectedSocket() client: AuthSocket, @MessageBody() data: WsEvents.VoiceJoin) {
    const { channelId } = data;
    if (!this.voiceRooms.has(channelId)) this.voiceRooms.set(channelId, new Map());
    const room = this.voiceRooms.get(channelId);

    // Build peer list before adding self
    const peerIds = [...room.keys()];
    const peerUsers = await this.prisma.user.findMany({
      where: { id: { in: peerIds } },
      select: { id: true, displayName: true },
    });

    client.join(`voice:${channelId}`);
    room.set(client.user.id, client.id);

    // Tell the new joiner who's in the room
    client.emit('voice:peers', {
      channelId,
      peers: peerUsers.map((u) => ({ id: u.id, displayName: u.displayName, isMuted: false })),
    } satisfies WsEvents.VoicePeers);

    // Tell everyone else someone joined
    client.to(`voice:${channelId}`).emit('voice:peer_joined', {
      channelId,
      peer: { id: client.user.id, displayName: client.user.displayName },
    } satisfies WsEvents.VoicePeerJoined);
  }

  @SubscribeMessage('voice:leave')
  handleVoiceLeave(@ConnectedSocket() client: AuthSocket, @MessageBody() data: WsEvents.VoiceLeave) {
    const { channelId } = data;
    if (this.voiceRooms.has(channelId)) {
      this.voiceRooms.get(channelId).delete(client.user.id);
      if (this.voiceRooms.get(channelId).size === 0) this.voiceRooms.delete(channelId);
    }
    client.leave(`voice:${channelId}`);
    client.to(`voice:${channelId}`).emit('voice:peer_left', { channelId, peerId: client.user.id } satisfies WsEvents.VoicePeerLeft);
  }

  @SubscribeMessage('voice:signal')
  handleVoiceSignal(@ConnectedSocket() client: AuthSocket, @MessageBody() data: WsEvents.VoiceSignal) {
    // Find target socket and forward signal directly
    const room = this.voiceRooms.get(data.channelId);
    if (!room) return;
    const targetSocketId = room.get(data.to);
    if (!targetSocketId) return;

    this.server.to(targetSocketId).emit('voice:signal', {
      type: data.type,
      from: client.user.id,
      data: data.data,
    } satisfies WsEvents.VoiceSignalReceived);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private stopTyping(channelId: string, userId: string) {
    const typers = this.typingState.get(channelId);
    if (!typers?.has(userId)) return;
    clearTimeout(typers.get(userId).timer);
    typers.delete(userId);
    this.broadcastTyping(channelId);
  }

  private broadcastTyping(channelId: string) {
    const typers = this.typingState.get(channelId) ?? new Map();
    const users = [...typers.entries()].map(([id, { displayName }]) => ({ id, displayName }));
    this.server
      .to(`channel:${channelId}`)
      .emit('typing:update', { channelId, users } satisfies WsEvents.TypingUpdate);
  }

  // Public method for broadcasting channel updates (e.g. after admin creates channel)
  broadcastChannelUpdate(channels: any[]) {
    this.server.emit('channels:updated', { channels });
  }
}
