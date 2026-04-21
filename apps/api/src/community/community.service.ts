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

  async getMembers() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, displayName: true },
      orderBy: { displayName: 'asc' },
    });
  }
}
