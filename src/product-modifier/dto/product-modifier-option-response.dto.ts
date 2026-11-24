import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { InventoryPolicy } from '../../../prisma/generated/prisma/enums.js';

class ModifierOptionInventoryItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ maxLength: 255, example: 'Ayam Suwir' })
  name!: string;

  @ApiProperty({ example: 'GRAM' })
  unit!: string;
}

export class ProductModifierOptionResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  modifierGroupId!: string;

  @ApiProperty({ maxLength: 255, example: 'Ayam Suwir' })
  name!: string;

  @ApiProperty({
    maxLength: 2000,
    nullable: true,
    example: 'Ayam suwir pedas',
  })
  description!: string | null;

  @ApiProperty({
    example: 2500,
    minimum: 0,
    description: 'Additional amount added to the product selling price',
  })
  price!: number;

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description:
      'Inventory item consumed when this option is selected, if configured',
  })
  inventoryItemId!: string | null;

  @ApiProperty({
    nullable: true,
    minimum: 0,
    example: 30,
    description:
      'Inventory quantity consumed per selected option, in the inventory item base unit',
  })
  inventoryQuantity!: number | null;

  @ApiProperty({ example: false })
  trackInventory!: boolean;

  @ApiProperty({ enum: InventoryPolicy, example: InventoryPolicy.STRICT })
  inventoryPolicy!: InventoryPolicy;

  @ApiProperty({
    type: ModifierOptionInventoryItemDto,
    nullable: true,
    description: 'Resolved inventory item snapshot for this configuration',
  })
  inventoryItem!: ModifierOptionInventoryItemDto | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 0, minimum: 0 })
  sortOrder!: number;
}
