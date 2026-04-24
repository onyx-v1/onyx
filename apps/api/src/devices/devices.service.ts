import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  /** Upsert an FCM token — creates or updates the device record. */
  async registerToken(userId: string, fcmToken: string): Promise<void> {
    await this.prisma.device.upsert({
      where: { fcmToken },
      update: { userId, updatedAt: new Date() },
      create: { userId, fcmToken, platform: 'android' },
    });
  }

  /** Remove a token (called on logout so the device stops receiving pushes). */
  async unregisterToken(fcmToken: string): Promise<void> {
    await this.prisma.device.deleteMany({ where: { fcmToken } });
  }

  /** Get all FCM tokens for a set of user IDs (used by the gateway). */
  async getTokensForUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const devices = await this.prisma.device.findMany({
      where: { userId: { in: userIds } },
      select: { fcmToken: true },
    });
    return devices.map((d) => d.fcmToken);
  }
}
