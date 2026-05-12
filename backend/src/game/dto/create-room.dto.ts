import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  guestId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(20)
  nickname: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  initialTime?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  increment?: number;
}
