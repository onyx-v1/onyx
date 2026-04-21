import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateDisplayNameDto } from './dto/create-user.dto';

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  role: true,
  createdAt: true,
};

// Generates a 7-char alphanumeric code, e.g. onyx_a3b2c1d
function generateCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

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
    // Auto-generate unique username
    let username: string;
    let attempts = 0;
    do {
      username = `onyx_${generateCode()}`;
      attempts++;
      if (attempts > 10) throw new ConflictException('Could not generate unique ID, try again');
    } while (await this.prisma.user.findUnique({ where: { username } }));

    return this.prisma.user.create({
      data: {
        username,
        displayName: dto.displayName.trim(),
      },
      select: USER_SELECT,
    });
  }

  async updateDisplayName(id: string, dto: UpdateDisplayNameDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { displayName: dto.displayName.trim() },
      select: USER_SELECT,
    });
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') {
      throw new ConflictException('Cannot delete the admin account');
    }

    await this.prisma.session.deleteMany({ where: { userId: id } });
    await this.prisma.message.updateMany({
      where: { authorId: id },
      data: { deleted: true, content: '[deleted]' },
    });
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
