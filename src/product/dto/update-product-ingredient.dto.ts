import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateProductIngredientDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf(
    (ingredient: UpdateProductIngredientDto) =>
      !ingredient.id || ingredient.inventoryItemId !== undefined,
  )
  @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional({ minimum: 0.01, example: 100 })
  @ValidateIf(
    (ingredient: UpdateProductIngredientDto) =>
      !ingredient.id || ingredient.quantity !== undefined,
  )
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  quantity?: number;
}
