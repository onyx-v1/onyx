import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class VoiceService {
  constructor(private config: ConfigService) {}

  async createToken(channelId: string, userId: string, displayName: string): Promise<{ token: string; url: string }> {
    const apiKey    = this.config.getOrThrow<string>('LIVEKIT_API_KEY');
    const apiSecret = this.config.getOrThrow<string>('LIVEKIT_API_SECRET');
    const url       = this.config.getOrThrow<string>('LIVEKIT_URL');

    const token = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name:     displayName,
      ttl:      '4h',
    });

    token.addGrant({
      room:          channelId,   // channel ID is the LiveKit room name
      roomJoin:      true,
      canPublish:    true,
      canSubscribe:  true,
      canPublishData: true,
    });

    return { token: await token.toJwt(), url };
  }
}
