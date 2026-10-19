import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { InventoryTransactionResponseDto } from './inventory-transaction-response.dto.js';

export class InventoryTransactionGetByPagesResponseDto {
  @ApiProperty({ type: [InventoryTransactionResponseDto] })
  items!: InventoryTransactionResponseDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
