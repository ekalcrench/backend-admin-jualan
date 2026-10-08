import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { InventoryLotResponseDto } from './inventory-lot-response.dto.js';

export class InventoryLotGetByPagesResponseDto {
  @ApiProperty({ type: [InventoryLotResponseDto] })
  items!: InventoryLotResponseDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
