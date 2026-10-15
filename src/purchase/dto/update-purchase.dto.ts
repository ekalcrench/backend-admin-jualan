import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PurchaseStatus } from '../../../prisma/generated/prisma/client.js';
import { CreatePurchaseDto } from './create-purchase.dto.js';
import { UpdatePurchaseItemDto } from './update-purchase-item.dto.js';

export class UpdatePurchaseDto extends PartialType(
  OmitType(CreatePurchaseDto, ['purchaseItems'] as const),
) {
  @ApiPropertyOptional({ enum: PurchaseStatus })
  @IsOptional()
  @IsEnum(PurchaseStatus)
  status?: PurchaseStatus;

  @ApiPropertyOptional({ type: [UpdatePurchaseItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePurchaseItemDto)
  purchaseItems?: UpdatePurchaseItemDto[];

  @ApiPropertyOptional({ type: [String], format: 'uuid', uniqueItems: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  deletedPurchaseItemIds?: string[];
}
