import { Module } from '@nestjs/common';
import { OnyxGateway } from './onyx.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [OnyxGateway],
  exports: [OnyxGateway],
})
export class GatewayModule {}
