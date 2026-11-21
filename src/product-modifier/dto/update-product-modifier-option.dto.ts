import { PartialType } from '@nestjs/swagger';
import { CreateProductModifierOptionDto } from './create-product-modifier-option.dto.js';

export class UpdateProductModifierOptionDto extends PartialType(
  CreateProductModifierOptionDto,
) {}
