import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CommunityService } from './community.service';
import { IsString, MinLength, MaxLength } from 'class-validator';

class UpdateNameDto {
  @IsString() @MinLength(1) @MaxLength(64)
  name: string;
}

@Controller('community')
@UseGuards(JwtAuthGuard)
export class CommunityController {
  constructor(private communityService: CommunityService) {}

  @Get()
  getCommunity() {
    return this.communityService.getCommunity();
  }

  @Get('members')
  getMembers() {
    return this.communityService.getMembers();
  }

  @Patch('name')
  @UseGuards(AdminGuard)
  updateName(@Body() dto: UpdateNameDto) {
    return this.communityService.updateName(dto.name);
  }
}
