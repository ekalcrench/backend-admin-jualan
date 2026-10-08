import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseDto } from './create-purchase.dto.js';

export class UpdatePurchaseDto extends PartialType(CreatePurchaseDto) {}
