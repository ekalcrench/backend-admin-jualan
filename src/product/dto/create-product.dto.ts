import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateProductIngredientDto } from './create-product-ingredient.dto.js';

export class CreateProductDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ minimum: 0, example: 12500 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  sellingPrice!: number;

  @ApiPropertyOptional({
    default: true,
    description: 'Inactive products cannot be added to new orders',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: [CreateProductIngredientDto] })
  @IsArray()
  @ArrayUnique(
    (ingredient: CreateProductIngredientDto) => ingredient.inventoryItemId,
  )
  @ValidateNested({ each: true })
  @Type(() => CreateProductIngredientDto)
  productIngredients!: CreateProductIngredientDto[];
}
