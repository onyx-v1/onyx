import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  displayName: string;
}

export class UpdateDisplayNameDto {
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  displayName: string;
}
