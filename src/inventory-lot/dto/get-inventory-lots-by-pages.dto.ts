import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';
import { DefaultGetByPagesDto } from '../../common/dto/default-get-by-pages.dto.js';

export class GetInventoryLotsByPagesDto extends DefaultGetByPagesDto {
  @ApiProperty({ description: 'Inventory item UUID', required: true })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId!: string;
}
