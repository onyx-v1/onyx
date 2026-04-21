import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CommunityService } from './community.service';
import { IsString, MinLength, MaxLength } from 'class-validator';

class UpdateNameDto {
  @IsString() @MinLength(1) @MaxLength(64)
  name: string;
}

@Controller('community')
export class CommunityController {
  constructor(
    private communityService: CommunityService,
    private config: ConfigService,
  ) {}

  /** Public — returns runtime config the frontend needs without build-time env vars */
  @Get('config')
  getConfig() {
    const raw    = this.config.get<string>('VITE_CLOUDINARY_URL') ?? '';
    const m      = raw.match(/^cloudinary:\/\/(\d+):([^@]+)@(.+)$/);
    return {
      cloudinaryCloudName:    m?.[3] ?? '',
      cloudinaryUploadPreset: this.config.get<string>('CLOUDINARY_UPLOAD_PRESET') ?? '',
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getCommunity() {
    return this.communityService.getCommunity();
  }

  @Get('members')
  @UseGuards(JwtAuthGuard)
  getMembers() {
    return this.communityService.getMembers();
  }

  @Patch('name')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateName(@Body() dto: UpdateNameDto) {
    return this.communityService.updateName(dto.name);
  }
}
