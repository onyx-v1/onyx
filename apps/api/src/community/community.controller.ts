import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommunityService } from './community.service';

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  @Get()
  getCommunity() {
    return this.communityService.getCommunity();
  }
}
