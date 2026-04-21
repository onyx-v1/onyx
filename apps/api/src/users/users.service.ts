import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  role: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username.toLowerCase() },
    });
    if (existing) throw new ConflictException(`Username @${dto.username} is already taken`);

    return this.prisma.user.create({
      data: {
        username: dto.username.toLowerCase(),
        displayName: dto.displayName.trim(),
      },
      select: USER_SELECT,
    });
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.username === 'knull_onyx') {
      throw new ConflictException('Cannot delete the admin account');
    }

    // Cascade: sessions, messages soft-deleted
    await this.prisma.session.deleteMany({ where: { userId: id } });
    await this.prisma.message.updateMany({
      where: { authorId: id },
      data: { deleted: true, content: '[deleted]' },
    });
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
