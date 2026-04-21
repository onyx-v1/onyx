import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto, UpdateDisplayNameDto } from './dto/create-user.dto';

const USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
};

// Generates a 7-char alphanumeric code, e.g. onyx_a3b2c1d
function generateCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 7 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Cloudinary helpers ─────────────────────────────────────────────────────────

/** Parse the monolithic CLOUDINARY_URL env var:
 *  cloudinary://API_KEY:API_SECRET@CLOUD_NAME
 */
function parseCloudinaryUrl(raw: string | undefined) {
  if (!raw) return null;
  const m = raw.match(/^cloudinary:\/\/(\d+):([^@]+)@(.+)$/);
  if (!m) return null;
  return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] };
}

/**
 * Delete an asset from Cloudinary using a SHA-1 signed destroy request.
 * Runs silently — failures don't block the avatar update.
 */
async function destroyCloudinaryAsset(url: string, config: ConfigService) {
  try {
    const creds = parseCloudinaryUrl(config.get<string>('CLOUDINARY_URL'));
    if (!creds) return; // env var not set — skip

    // Extract public_id from URL
    // e.g. https://res.cloudinary.com/dcks1ojja/image/upload/v1234/onyx/avatars/file.jpg
    //   → public_id = "onyx/avatars/file"
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]{2,5}(?:\?.*)?$/i);
    if (!match) return;
    const publicId = match[1];

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = createHash('sha1')
      .update(`public_id=${publicId}&timestamp=${timestamp}${creds.apiSecret}`)
      .digest('hex');

    const form = new URLSearchParams({
      public_id: publicId,
      timestamp,
      api_key:   creds.apiKey,
      signature,
    });

    await fetch(`https://api.cloudinary.com/v1_1/${creds.cloudName}/image/destroy`, {
      method:  'POST',
      body:    form.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch {
    console.warn('[UsersService] Failed to delete old Cloudinary asset:', url);
  }
}


@Injectable()
export class UsersService {
  constructor(
    private prisma:  PrismaService,
    private config:  ConfigService,
  ) {}

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

  async updateAvatar(id: string, avatarUrl: string) {
    // Fetch current avatar URL so we can delete it from Cloudinary
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { avatarUrl: true },
    });

    // Delete old asset (non-blocking — runs in background)
    if (user?.avatarUrl && user.avatarUrl.includes('cloudinary.com')) {
      destroyCloudinaryAsset(user.avatarUrl, this.config);
    }

    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: USER_SELECT,
    });
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role === 'ADMIN') {
      throw new ConflictException('Cannot delete the admin account');
    }

    // Clean up Cloudinary avatar if one exists
    if (user.avatarUrl && user.avatarUrl.includes('cloudinary.com')) {
      await destroyCloudinaryAsset(user.avatarUrl, this.config);
    }

    // 1. Null out replyToId for any message that replies to one of this user's messages
    await this.prisma.message.updateMany({
      where: { replyTo: { authorId: id } },
      data:  { replyToId: null },
    });

    // 2. Hard-delete the user's messages (soft-delete keeps authorId FK → still fails)
    await this.prisma.message.deleteMany({ where: { authorId: id } });

    // 3. Delete sessions
    await this.prisma.session.deleteMany({ where: { userId: id } });

    // 4. Finally remove the user row
    await this.prisma.user.delete({ where: { id } });

    return { ok: true };
  }
}
