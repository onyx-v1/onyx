import { IsString, IsEnum, IsOptional, IsNumber, MinLength, MaxLength, Matches } from 'class-validator';

export enum ChannelTypeDto {
  TEXT = 'TEXT',
  VOICE = 'VOICE',
}

export class CreateChannelDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'Channel name may only contain lowercase letters, numbers, hyphens, and underscores',
  })
  name: string;

  @IsEnum(ChannelTypeDto)
  type: ChannelTypeDto;

  @IsOptional()
  @IsNumber()
  position?: number;
}
