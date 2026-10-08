import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { InventoryItemResponseDto } from './inventory-item-response.dto.js';

export class InventoryItemGetByPagesResponseDto {
  @ApiProperty({ type: [InventoryItemResponseDto] })
  items!: InventoryItemResponseDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
