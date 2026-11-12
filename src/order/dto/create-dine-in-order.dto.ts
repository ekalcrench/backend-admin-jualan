import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { personNameExample } from '../../common/constants/api-value-example.constants.js';

export class CreateDineInOrderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tableId!: string;

  @ApiPropertyOptional({ maxLength: 255, example: personNameExample })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  guestCount?: number;
}
