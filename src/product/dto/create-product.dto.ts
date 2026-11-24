import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  InventoryPolicy,
  ProductStockManagement,
} from '../../../prisma/generated/prisma/enums.js';
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

  @ApiPropertyOptional({
    enum: ProductStockManagement,
    default: ProductStockManagement.UNTRACKED,
  })
  @IsOptional()
  @IsEnum(ProductStockManagement)
  stockManagement?: ProductStockManagement;

  @ApiPropertyOptional({
    minimum: 0,
    description: 'Required for MANUAL stock management',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    enum: InventoryPolicy,
    default: InventoryPolicy.STRICT,
  })
  @IsOptional()
  @IsEnum(InventoryPolicy)
  inventoryPolicy?: InventoryPolicy;

  @ApiPropertyOptional({ type: [CreateProductIngredientDto], default: [] })
  @IsOptional()
  @IsArray()
  @ArrayUnique(
    (ingredient: CreateProductIngredientDto) => ingredient.inventoryItemId,
  )
  @ValidateNested({ each: true })
  @Type(() => CreateProductIngredientDto)
  productIngredients?: CreateProductIngredientDto[];
}
