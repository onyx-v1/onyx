import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async getCommunity() {
    return this.prisma.community.findFirst({
      include: {
        channels: {
          orderBy: [{ type: 'asc' }, { position: 'asc' }],
        },
      },
    });
  }

  async updateName(name: string) {
    const community = await this.prisma.community.findFirst();
    if (!community) return;
    return this.prisma.community.update({
      where: { id: community.id },
      data: { name: name.trim() },
      select: { id: true, name: true },
    });
  }

  async getMembers() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, displayName: true, avatarUrl: true },
      orderBy: { displayName: 'asc' },
    });
  }
}
