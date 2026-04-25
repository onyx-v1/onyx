import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RefreshDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  // ── Private helpers ─────────────────────────────────────────────────────────

  private makeTokenPair(payload: { sub: string; username: string; role: string }) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: this.config.get<string>('JWT_SECRET'),
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
    });
    return { accessToken, refreshToken };
  }

  private sessionExpiresAt(): Date {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d;
  }

  // ── Public methods ───────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: dto.username.toLowerCase().trim() },
    });
    if (!user) throw new UnauthorizedException('User not found. Contact your admin.');

    const payload = { sub: user.id, username: user.username, role: user.role };
    const { accessToken, refreshToken } = this.makeTokenPair(payload);

    await this.prisma.session.create({
      data: { userId: user.id, refreshToken, expiresAt: this.sessionExpiresAt() },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id:          user.id,
        username:    user.username,
        displayName: user.displayName,
        role:        user.role,
        avatarUrl:   user.avatarUrl,
        createdAt:   user.createdAt.toISOString(),
      },
    };
  }

  async refresh(dto: RefreshDto) {
    const session = await this.prisma.session.findUnique({
      where:   { refreshToken: dto.refreshToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Session expired. Please log in again.');
    }

    const payload = {
      sub:      session.user.id,
      username: session.user.username,
      role:     session.user.role,
    };

    const { accessToken, refreshToken: newRefreshToken } = this.makeTokenPair(payload);

    // Rotate refresh token — invalidates old one, issues new 7-day token
    await this.prisma.session.update({
      where: { id: session.id },
      data:  { refreshToken: newRefreshToken, expiresAt: this.sessionExpiresAt() },
    });

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(dto: RefreshDto) {
    await this.prisma.session.deleteMany({ where: { refreshToken: dto.refreshToken } });
    return { ok: true };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { id: true, username: true, displayName: true, avatarUrl: true, role: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
