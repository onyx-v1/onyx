import { IsString, IsUrl, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(2,  { message: 'Username must be at least 2 characters' })
  @MaxLength(32, { message: 'Username must be at most 32 characters' })
  username: string;
}

export class RefreshDto {
  @IsString()
  refreshToken: string;
}

export class LogoutDto {
  @IsString()
  refreshToken: string;
}

export class UpdateAvatarDto {
  @IsString()
  @IsUrl({}, { message: 'avatarUrl must be a valid URL' })
  avatarUrl: string;
}
