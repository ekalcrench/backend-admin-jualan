import { ApiProperty } from '@nestjs/swagger';
import {
  InventoryPolicy,
  ProductStockManagement,
} from '../../../prisma/generated/prisma/enums.js';

export class ProductOptionsResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({ example: 12500 })
  sellingPrice!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({
    enum: ProductStockManagement,
    example: ProductStockManagement.UNTRACKED,
  })
  stockManagement!: ProductStockManagement;

  @ApiProperty({ enum: InventoryPolicy, example: InventoryPolicy.STRICT })
  inventoryPolicy!: InventoryPolicy;

  @ApiProperty({
    example: 7,
    nullable: true,
    description:
      'Manual stock, inventory-derived stock, or null when untracked',
  })
  stock!: number | null;
}
