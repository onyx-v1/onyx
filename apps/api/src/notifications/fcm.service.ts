import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app: admin.app.App | null = null;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const raw = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');
    if (!raw) {
      this.logger.warn('⚠️  FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled');
      return;
    }
    try {
      const serviceAccount = JSON.parse(raw) as admin.ServiceAccount & { project_id?: string };
      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.logger.log(`✅ Firebase Admin SDK initialised (project: ${serviceAccount.project_id ?? serviceAccount.projectId ?? 'unknown'})`);
    } catch (e) {
      this.logger.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON — check Railway variable format', e);
    }
  }

  /**
   * Send a push notification to a list of FCM tokens.
   * Automatically removes invalid/stale tokens from the DB.
   */
  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, string> = {},
  ): Promise<void> {
    if (!this.app || tokens.length === 0) return;

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'onyx-messages',
          icon: 'ic_launcher',
          color: '#9d8fff',
        },
      },
    };

    try {
      const result = await admin.messaging(this.app).sendEachForMulticast(message);
      if (result.failureCount > 0) {
        // Log failures (caller can clean up stale tokens if needed)
        result.responses.forEach((r, i) => {
          if (!r.success) {
            this.logger.warn(`FCM delivery failed for token[${i}]: ${r.error?.message}`);
          }
        });
      }
    } catch (e) {
      this.logger.error('FCM sendEachForMulticast error', e);
    }
  }
}
