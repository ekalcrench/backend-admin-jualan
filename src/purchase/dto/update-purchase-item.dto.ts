import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdatePurchaseItemDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  inventoryLotId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf(
    (item: UpdatePurchaseItemDto) =>
      !item.id || item.inventoryItemId !== undefined,
  )
  @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional({
    description: 'Number of packages purchased',
    minimum: 1,
    example: 6,
  })
  @ValidateIf(
    (item: UpdatePurchaseItemDto) => !item.id || item.quantity !== undefined,
  )
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Inventory units contained in each package',
    minimum: 0.01,
    example: 1000,
  })
  @ValidateIf(
    (item: UpdatePurchaseItemDto) => !item.id || item.packageSize !== undefined,
  )
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  packageSize?: number;

  @ApiPropertyOptional({ minimum: 0, example: 12.5 })
  @ValidateIf(
    (item: UpdatePurchaseItemDto) => !item.id || item.totalCost !== undefined,
  )
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalCost?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @ValidateIf(
    (item: UpdatePurchaseItemDto) => !item.id || item.receivedAt !== undefined,
  )
  @IsDateString()
  receivedAt?: string;

  @ApiPropertyOptional({ format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  expiredAt?: string | null;
}
