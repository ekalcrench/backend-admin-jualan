import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { CreatePurchaseDto } from './create-purchase.dto.js';
import { UpdatePurchaseItemDto } from './update-purchase-item.dto.js';

export class UpdatePurchaseDto extends PartialType(
  OmitType(CreatePurchaseDto, ['purchaseItems'] as const),
) {
  @ApiPropertyOptional({ type: [UpdatePurchaseItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseItemDto)
  purchaseItems?: UpdatePurchaseItemDto[];
}
