import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreateProductDto } from './create-product.dto.js';
import { UpdateProductIngredientDto } from './update-product-ingredient.dto.js';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['productIngredients'] as const),
) {
  @ApiPropertyOptional({ type: [UpdateProductIngredientDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateProductIngredientDto)
  productIngredients?: UpdateProductIngredientDto[];

  @ApiPropertyOptional({ type: [String], format: 'uuid', uniqueItems: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  deletedProductIngredientIds?: string[];
}
