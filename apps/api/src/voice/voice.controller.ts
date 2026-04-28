import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VoiceService } from './voice.service';

@Controller('voice')
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private voiceService: VoiceService) {}

  /**
   * GET /api/voice/:channelId/token
   * Returns a short-lived LiveKit JWT for the requesting user.
   * The room name = channelId (1:1 mapping).
   */
  @Get(':channelId/token')
  async getToken(@Param('channelId') channelId: string, @Req() req: any) {
    const { id, displayName } = req.user;
    return this.voiceService.createToken(channelId, id, displayName);
  }
}
