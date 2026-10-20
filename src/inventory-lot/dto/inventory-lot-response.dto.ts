import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';

export class InventoryLotResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  inventoryItemId!: string;

  @ApiPropertyOptional({ nullable: true, format: 'uuid', type: String })
  purchaseItemId!: string | null;

  @ApiPropertyOptional({ nullable: true, format: 'uuid', type: String })
  preparationOutputId!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Proses pembuatan soto' })
  preparationName!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'INV-001' })
  invoiceNumber!: string | null;

  @ApiPropertyOptional({ nullable: true, example: 'Yogya Toserba' })
  supplierName!: string | null;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  remainingQuantity!: number;

  @ApiProperty()
  unitCost!: number;

  @ApiProperty()
  totalCost!: number;

  @ApiProperty()
  receivedAt!: Date;

  @ApiPropertyOptional({ nullable: true, format: 'date', type: 'string' })
  expiredAt!: Date | null;
}
