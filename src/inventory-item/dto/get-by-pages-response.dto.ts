import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { InventoryItemResponseDto } from './inventory-item-response.dto.js';

export class InventoryItemByPagesDto extends InventoryItemResponseDto {
  @ApiProperty({
    description: 'Sum of remaining quantities across lots',
  })
  totalStock!: number;

  @ApiProperty({
    description: 'Remaining-quantity-weighted average unit cost across lots',
  })
  averageCost!: number;
}

export class GetByPagesResponseDto {
  @ApiProperty({ type: [InventoryItemByPagesDto] })
  items!: InventoryItemByPagesDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
