import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { InventoryUnit } from '../../../prisma/generated/prisma/enums.js';
import { InventoryTransactionType } from '../../../prisma/generated/prisma/enums.js';

export class InventoryTransactionItemResponseDto {
  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: InventoryUnit })
  unit!: InventoryUnit;
}

export class InventoryTransactionResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ format: 'uuid' })
  inventoryItemId!: string;

  @ApiProperty({ format: 'uuid' })
  inventoryLotId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  referenceId?: string;

  @ApiProperty({ enum: InventoryTransactionType })
  type!: InventoryTransactionType;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  totalCost!: number;

  @ApiProperty()
  unitCost!: number;

  @ApiProperty({ type: InventoryTransactionItemResponseDto })
  inventoryItem!: InventoryTransactionItemResponseDto;
}
