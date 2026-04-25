import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DevicesService {
  constructor(private prisma: PrismaService) {}

  /** Upsert an FCM token — creates or updates the device record. */
  async registerToken(userId: string, fcmToken: string): Promise<void> {
    await this.prisma.device.upsert({
      where:  { fcmToken },
      update: { userId, updatedAt: new Date() },
      create: { userId, fcmToken, platform: 'android' },
    });
  }

  /** Remove a token — called on logout so the device stops receiving pushes. */
  async unregisterToken(fcmToken: string): Promise<void> {
    await this.prisma.device.deleteMany({ where: { fcmToken } });
  }

  /**
   * Get all FCM tokens for a set of user IDs.
   * Used when targeting specific users (e.g. @mention push).
   */
  async getTokensForUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) return [];
    const devices = await this.prisma.device.findMany({
      where:    { userId: { in: userIds } },
      select:   { fcmToken: true },
      distinct: ['fcmToken'],
    });
    return devices.map((d) => d.fcmToken);
  }

  /**
   * Get all FCM tokens EXCLUDING specific user IDs.
   * Used for broadcast pushes (skip sender + online users).
   */
  async getTokensExcluding(excludeUserIds: string[]): Promise<string[]> {
    if (excludeUserIds.length === 0) {
      const all = await this.prisma.device.findMany({
        select:   { fcmToken: true },
        distinct: ['fcmToken'],
      });
      return all.map((d) => d.fcmToken);
    }
    const devices = await this.prisma.device.findMany({
      where:    { userId: { notIn: excludeUserIds } },
      select:   { fcmToken: true },
      distinct: ['fcmToken'],
    });
    return devices.map((d) => d.fcmToken);
  }
}
