import { PartialType } from '@nestjs/swagger';
import { CreateProductModifierGroupDto } from './create-product-modifier-group.dto.js';

export class UpdateProductModifierGroupDto extends PartialType(
  CreateProductModifierGroupDto,
) {}
