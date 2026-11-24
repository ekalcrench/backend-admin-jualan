import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { InventoryPolicy } from '../../../prisma/generated/prisma/enums.js';
import { trimModifierName } from './create-product-modifier-group.dto.js';

export class CreateProductModifierOptionDto {
  @ApiProperty({ maxLength: 255, example: 'Ayam Suwir' })
  @Transform(trimModifierName)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ maxLength: 2000, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({ default: 0, minimum: 0, example: 2500 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
    description:
      'Inventory item consumed when this option is selected. Omit or send null for options that do not consume inventory.',
  })
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    minimum: 0.01,
    example: 30,
    description:
      'Inventory quantity consumed per selected option, in the inventory item base unit. Required when inventoryItemId is set and must be greater than zero.',
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  inventoryQuantity?: number | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  trackInventory?: boolean;

  @ApiPropertyOptional({
    enum: InventoryPolicy,
    default: InventoryPolicy.STRICT,
  })
  @IsOptional()
  @IsEnum(InventoryPolicy)
  inventoryPolicy?: InventoryPolicy;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
