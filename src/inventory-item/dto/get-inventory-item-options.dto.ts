import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetInventoryItemOptionsDto {
  @ApiPropertyOptional({ description: 'Search inventory item name' })
  @IsString()
  @IsOptional()
  search?: string;
}
