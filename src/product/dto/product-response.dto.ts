import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { InventoryUnit } from '../../../prisma/generated/prisma/enums.js';

export class ProductIngredientResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  inventoryItemId!: string;

  @ApiProperty({ minimum: 0.01 })
  quantity!: number;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      unit: { enum: Object.values(InventoryUnit) },
    },
  })
  inventoryItem!: {
    id: string;
    name: string;
    unit: InventoryUnit;
  };
}

export class ProductResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({ minimum: 0 })
  sellingPrice!: number;

  @ApiProperty({ type: [ProductIngredientResponseDto] })
  productIngredients!: ProductIngredientResponseDto[];
}
