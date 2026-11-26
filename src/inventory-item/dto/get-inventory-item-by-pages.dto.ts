import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { InventoryUnit } from '../../../prisma/generated/prisma/enums.js';
import { DefaultGetByPagesDto } from '../../common/dto/default-get-by-pages.dto.js';

export class GetInventoryItemByPagesDto extends DefaultGetByPagesDto {
  @ApiPropertyOptional({ enum: InventoryUnit })
  @IsEnum(InventoryUnit)
  @IsOptional()
  unit?: InventoryUnit;
}
