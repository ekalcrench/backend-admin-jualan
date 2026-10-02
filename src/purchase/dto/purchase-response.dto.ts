import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';

class PurchaseInventoryItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  unit!: string;
}

class PurchaseInventoryLotDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  remainingQuantity!: number;

  @ApiProperty()
  unitCost!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  receivedAt!: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  expiredAt!: Date | null;
}

class PurchaseItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  inventoryItemId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitCost!: number;

  @ApiProperty({ type: PurchaseInventoryItemDto })
  inventoryItem!: PurchaseInventoryItemDto;

  @ApiPropertyOptional({ type: PurchaseInventoryLotDto, nullable: true })
  inventoryLot!: PurchaseInventoryLotDto | null;
}

export class PurchaseResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiPropertyOptional({ nullable: true })
  supplierName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  invoiceNumber!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  purchasedAt!: Date;

  @ApiProperty({ type: [PurchaseItemResponseDto] })
  purchaseItems!: PurchaseItemResponseDto[];
}
