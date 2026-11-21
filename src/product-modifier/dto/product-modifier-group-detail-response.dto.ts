import { ApiProperty } from '@nestjs/swagger';
import { ProductModifierGroupResponseDto } from './product-modifier-group-response.dto.js';
import { ProductModifierOptionResponseDto } from './product-modifier-option-response.dto.js';

export class ProductModifierGroupAssignedProductResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ maxLength: 255, example: 'Soto Padang Ayam' })
  name!: string;

  @ApiProperty({ example: 25000, minimum: 0 })
  sellingPrice!: number;

  @ApiProperty({ format: 'uuid' })
  mappingId!: string;

  @ApiProperty({
    example: 0,
    minimum: 0,
    description: 'Display order of this group on the product',
  })
  sortOrder!: number;
}

export class ProductModifierGroupDetailResponseDto extends ProductModifierGroupResponseDto {
  @ApiProperty({ type: [ProductModifierOptionResponseDto] })
  options!: ProductModifierOptionResponseDto[];

  @ApiProperty({ type: [ProductModifierGroupAssignedProductResponseDto] })
  products!: ProductModifierGroupAssignedProductResponseDto[];
}
