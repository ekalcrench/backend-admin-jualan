import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePurchaseDto } from './create-purchase.dto.js';

export class UpdatePurchaseDto extends PartialType(
  OmitType(CreatePurchaseDto, ['purchaseItems'] as const),
) {}
