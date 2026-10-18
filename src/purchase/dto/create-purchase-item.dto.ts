import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePurchaseItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  inventoryItemId!: string;

  @ApiProperty({
    description: 'Number of packages purchased',
    minimum: 1,
    example: 6,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({
    description: 'Inventory units contained in each package',
    minimum: 0.01,
    example: 1000,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  packageSize!: number;

  @ApiProperty({ minimum: 0, example: 20000 })
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
