import { Body, Controller, Delete, HttpCode, Post, Request, UseGuards } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

export class RegisterTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}

@Controller('devices')
@UseGuards(JwtAuthGuard)
export class DevicesController {
  constructor(private devices: DevicesService) {}

  /** POST /api/devices/register — call once after obtaining the FCM token */
  @Post('register')
  @HttpCode(201)
  async register(@Request() req: any, @Body() body: RegisterTokenDto) {
    await this.devices.registerToken(req.user.id, body.fcmToken);
    return { ok: true };
  }

  /** DELETE /api/devices/unregister — call on logout to stop receiving pushes */
  @Delete('unregister')
  @HttpCode(200)
  async unregister(@Body() body: RegisterTokenDto) {
    await this.devices.unregisterToken(body.fcmToken);
    return { ok: true };
  }
}
