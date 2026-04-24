import { Module } from '@nestjs/common';
import { OnyxGateway } from './onyx.gateway';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports:   [AuthModule, NotificationsModule, DevicesModule],
  providers: [OnyxGateway],
  exports:   [OnyxGateway],
})
export class GatewayModule {}
