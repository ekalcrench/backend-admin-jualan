import { ApiProperty } from '@nestjs/swagger';

export class OrderItemModifierResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  modifierGroupId!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  modifierOptionId!: string | null;

  @ApiProperty({ maxLength: 255, example: 'Extra Isian' })
  groupName!: string;

  @ApiProperty({ maxLength: 255, example: 'Ayam Suwir' })
  optionName!: string;

  @ApiProperty({
    minimum: 0,
    example: 2500,
    description: 'Historical additional price snapshot for this option',
  })
  unitPrice!: number;

  @ApiProperty({
    format: 'uuid',
    nullable: true,
    description:
      'Inventory item snapshot consumed by this option at order time, if any',
  })
  inventoryItemId!: string | null;

  @ApiProperty({
    nullable: true,
    minimum: 0,
    example: 30,
    description:
      'Inventory quantity consumed per selected option at order time, in the inventory item base unit',
  })
  inventoryQuantity!: number | null;

  @ApiProperty({ minimum: 0, example: 0 })
  sortOrder!: number;
}
