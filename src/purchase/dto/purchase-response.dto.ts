import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import {
  invoiceExample,
  supplierNameExample,
} from '../../common/constants/api-value-example.constants.js';

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

  @ApiProperty()
  totalCost!: number;

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
  totalCost!: number;

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

  @ApiProperty({ description: supplierNameExample })
  supplierName!: string;

  @ApiProperty({ description: invoiceExample })
  invoiceNumber!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  purchasedAt!: Date;

  @ApiProperty({ type: [PurchaseItemResponseDto] })
  purchaseItems!: PurchaseItemResponseDto[];
}
