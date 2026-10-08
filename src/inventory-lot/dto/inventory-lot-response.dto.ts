import { ApiProperty } from '@nestjs/swagger';

export class InventoryLotResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  inventoryItemId!: string;

  @ApiProperty()
  purchaseItemId!: string;

  @ApiProperty({ nullable: true })
  invoiceNumber!: string | null;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  remainingQuantity!: number;

  @ApiProperty()
  unitCost!: number;

  @ApiProperty()
  receivedAt!: Date;

  @ApiProperty({ nullable: true })
  expiredAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
