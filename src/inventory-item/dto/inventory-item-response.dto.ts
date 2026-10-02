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
}
