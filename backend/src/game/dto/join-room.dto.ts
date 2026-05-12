import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  guestId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}
