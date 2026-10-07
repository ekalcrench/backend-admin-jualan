import { ApiProperty } from '@nestjs/swagger';
import { InventoryUnit } from '../../../prisma/generated/prisma/enums.js';

export class InventoryItemOptionsResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ maxLength: 255 })
  name!: string;

  @ApiProperty({ enum: InventoryUnit })
  unit!: InventoryUnit;
}
