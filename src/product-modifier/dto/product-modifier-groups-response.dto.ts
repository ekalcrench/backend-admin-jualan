import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { ProductModifierOptionResponseDto } from './product-modifier-option-response.dto.js';

export class ProductModifierProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ maxLength: 255, example: 'Soto Padang Ayam' })
  name!: string;

  @ApiProperty({ example: 25000, minimum: 0 })
  sellingPrice!: number;
}

export class ProductModifierGroupOnProductResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  mappingId!: string;

  @ApiProperty({ maxLength: 255, example: 'Extra Isian' })
  name!: string;

  @ApiProperty({ maxLength: 2000, nullable: true })
  description!: string | null;

  @ApiProperty({ example: false })
  isRequired!: boolean;

  @ApiProperty({ example: 0, minimum: 0 })
  minSelection!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  maxSelection!: number;

  @ApiProperty({ example: false })
  isMultiple!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    example: 0,
    minimum: 0,
    description: 'Display order of this group on the product',
  })
  sortOrder!: number;

  @ApiProperty({ type: [ProductModifierOptionResponseDto] })
  options!: ProductModifierOptionResponseDto[];
}

export class ProductModifierGroupsResponseDto {
  @ApiProperty({ type: ProductModifierProductResponseDto })
  product!: ProductModifierProductResponseDto;

  @ApiProperty({ type: [ProductModifierGroupOnProductResponseDto] })
  modifierGroups!: ProductModifierGroupOnProductResponseDto[];
}
