import { Body, Controller, Delete, Post, UseGuards, Request } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

class RegisterTokenDto {
  fcmToken: string;
}

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private devices: DevicesService) {}

  /** POST /api/devices/register — call this once after getting the FCM token */
  @Post('register')
  async register(@Request() req: any, @Body() body: RegisterTokenDto) {
    await this.devices.registerToken(req.user.userId, body.fcmToken);
    return { ok: true };
  }

  /** DELETE /api/devices/unregister — call on logout to stop notifications */
  @Delete('unregister')
  async unregister(@Body() body: RegisterTokenDto) {
    await this.devices.unregisterToken(body.fcmToken);
    return { ok: true };
  }
}
