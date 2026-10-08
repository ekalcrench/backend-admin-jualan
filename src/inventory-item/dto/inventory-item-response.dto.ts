import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { InventoryUnit } from '../../../prisma/generated/prisma/enums.js';

export class InventoryItemResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({ enum: InventoryUnit })
  unit!: InventoryUnit;

  @ApiProperty({ description: 'Sum of remaining quantities across lots' })
  totalStock!: number;

  @ApiProperty({
    description: 'Sum of unit costs across lots',
  })
  totalCost!: number;

  @ApiProperty({
    description: 'Sum of lot unit costs divided by total stock',
  })
  averageCost!: number;
}
