import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';

@Module({
  imports: [ConfigModule],
  providers: [CommunityService],
  controllers: [CommunityController],
})
export class CommunityModule {}
