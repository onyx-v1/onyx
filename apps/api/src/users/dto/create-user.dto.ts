import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Username may only contain lowercase letters, numbers, and underscores',
  })
  username: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName: string;
}
