import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CardStatus } from '../../entities/card.entity';

export class UpdateCardDto {
  @IsString()
  @IsOptional()
  @MaxLength(160)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @IsEnum(CardStatus)
  @IsOptional()
  status?: CardStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}
