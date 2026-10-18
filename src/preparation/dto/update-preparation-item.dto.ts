import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsUUID, Min, ValidateIf } from 'class-validator';

export class UpdatePreparationItemDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf(
    (item: UpdatePreparationItemDto) =>
      !item.id || item.inventoryItemId !== undefined,
  )
  @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional({ minimum: 0.01, example: 300 })
  @ValidateIf(
    (item: UpdatePreparationItemDto) => !item.id || item.quantity !== undefined,
  )
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity?: number;
}
