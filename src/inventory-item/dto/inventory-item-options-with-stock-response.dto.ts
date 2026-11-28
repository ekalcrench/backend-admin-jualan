import { ApiProperty } from '@nestjs/swagger';
import { InventoryItemOptionsResponseDto } from './inventory-item-options-response.dto.js';

export class InventoryItemOptionsWithStockResponseDto extends InventoryItemOptionsResponseDto {
  @ApiProperty({ type: Number })
  stock!: number;
}
