import { ApiProperty } from '@nestjs/swagger';
import { OrderItemModifierResponseDto } from './order-item-modifier-response.dto.js';
import { CostingStatus } from '../../../prisma/generated/prisma/enums.js';

export class OrderItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ minimum: 1 })
  quantity!: number;

  @ApiProperty({
    minimum: 0,
    description: 'Base product price, excluding modifier prices',
  })
  unitPrice!: number;

  @ApiProperty({ minimum: 0, nullable: true })
  unitCost!: number | null;

  @ApiProperty({ enum: CostingStatus, example: CostingStatus.CALCULATED })
  costingStatus!: CostingStatus;

  @ApiProperty({
    minimum: 0,
    description: 'Sum of the selected modifier snapshot prices',
  })
  modifierTotal!: number;

  @ApiProperty({
    minimum: 0,
    description: 'Base product price plus modifier prices for one unit',
  })
  unitTotal!: number;

  @ApiProperty({
    minimum: 0,
    description: 'unitTotal multiplied by quantity',
  })
  subtotal!: number;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
    },
  })
  product!: { id: string; name: string };

  @ApiProperty({ type: [OrderItemModifierResponseDto] })
  modifiers!: OrderItemModifierResponseDto[];
}
