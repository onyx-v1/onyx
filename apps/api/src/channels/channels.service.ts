import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto } from './dto/create-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.channel.findMany({
      orderBy: [{ type: 'asc' }, { position: 'asc' }],
    });
  }

  async create(dto: CreateChannelDto) {
    const community = await this.prisma.community.findFirst();

    const existing = await this.prisma.channel.findUnique({
      where: { communityId_name: { communityId: community.id, name: dto.name } },
    });
    if (existing) throw new ConflictException(`Channel #${dto.name} already exists`);

    const maxPos = await this.prisma.channel.aggregate({
      _max: { position: true },
      where: { type: dto.type as any },
    });

    return this.prisma.channel.create({
      data: {
        name: dto.name.toLowerCase().replace(/\s+/g, '-'),
        type: dto.type as any,
        position: dto.position ?? (maxPos._max.position ?? -1) + 1,
        communityId: community.id,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.message.deleteMany({ where: { channelId: id } });
    await this.prisma.channel.delete({ where: { id } });
    return { ok: true };
  }
}
