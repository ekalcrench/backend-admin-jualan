import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePurchaseItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  inventoryItemId!: string;

  @ApiProperty({ minimum: 0.01, example: 5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity!: number;

  @ApiProperty({ minimum: 0, example: 12.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalCost!: number;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  receivedAt!: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @IsDateString()
  @IsOptional()
  expiredAt?: string;
}
