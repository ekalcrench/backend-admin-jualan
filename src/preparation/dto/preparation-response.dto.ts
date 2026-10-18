import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { PreparationStatus } from '../../../prisma/generated/prisma/client.js';

class PreparationInventoryItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  unit!: string;
}

class PreparationItemLotResponseDto {
  @ApiProperty({ format: 'uuid' })
  inventoryLotId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitCost!: number;

  @ApiProperty()
  totalCost!: number;
}

class PreparationItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  inventoryItemId!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  unitCost!: number;

  @ApiProperty()
  totalCost!: number;

  @ApiProperty({ type: PreparationInventoryItemDto })
  inventoryItem!: PreparationInventoryItemDto;

  @ApiProperty({ type: [PreparationItemLotResponseDto] })
  lotAllocations!: PreparationItemLotResponseDto[];
}

export class PreparationResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty()
  name!: string | null;

  @ApiProperty({ enum: PreparationStatus })
  status!: PreparationStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  preparedAt!: Date;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiProperty({ format: 'uuid' })
  outputInventoryItemId!: string;

  @ApiProperty()
  outputQuantity!: number;

  @ApiProperty()
  outputUnitCost!: number;

  @ApiProperty()
  outputTotalCost!: number;

  @ApiProperty({ type: PreparationInventoryItemDto })
  outputInventoryItem!: PreparationInventoryItemDto;

  @ApiProperty({ type: [PreparationItemResponseDto] })
  preparationItems!: PreparationItemResponseDto[];
}
