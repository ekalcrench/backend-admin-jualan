import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { InventoryUnit } from '../../../prisma/generated/prisma/enums.js';

export class CreateInventoryItemDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ enum: InventoryUnit, default: InventoryUnit.GRAM })
  @IsEnum(InventoryUnit)
  @IsOptional()
  unit?: InventoryUnit;
}
