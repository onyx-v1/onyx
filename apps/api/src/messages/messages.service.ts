import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MESSAGE_INCLUDE = {
  author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
  replyTo: {
    include: {
      author: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
    },
  },
  reactions: { select: { emoji: true, userId: true } },
};

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async findByChannel(channelId: string, before?: string, limit = 50) {
    const messages = await this.prisma.message.findMany({
      where: {
        channelId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });

    return messages.reverse();
  }

  async deleteMessage(messageId: string, userId: string, isAdmin: boolean) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    if (!isAdmin && message.authorId !== userId) throw new ForbiddenException();

    return this.prisma.message.update({
      where: { id: messageId },
      data: { deleted: true, content: '' },
    });
  }

  async getPinnedMessages(channelId: string) {
    return this.prisma.message.findMany({
      where: { channelId, pinned: true, deleted: false },
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(query: string, channelId?: string) {
    if (!query?.trim() || query.trim().length < 2) return [];
    return this.prisma.message.findMany({
      where: {
        deleted: false,
        content: { contains: query.trim(), mode: 'insensitive' },
        ...(channelId ? { channelId } : {}),
      },
      include: MESSAGE_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  async getLinkPreview(rawUrl: string) {
    try {
      const url = new URL(rawUrl);
      if (!['http:', 'https:'].includes(url.protocol)) return null;

      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5_000),
        headers: { 'User-Agent': 'Mozilla/5.0 OnyxBot/1.0' },
      });
      if (!res.ok) return null;

      const html = await res.text();

      const getOg = (prop: string) => {
        const a = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i'));
        const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'i'));
        return (a ?? b)?.[1] ?? null;
      };

      const title       = getOg('title') || html.match(/<title>([^<]+)<\/title>/i)?.[1] || null;
      const description = getOg('description')
        || html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]
        || null;
      const image    = getOg('image')    || null;
      const siteName = getOg('site_name') || url.hostname;

      if (!title) return null;
      return { url: url.toString(), title: title.trim(), description: description?.trim() ?? null, image, siteName };
    } catch {
      return null;
    }
  }
}
