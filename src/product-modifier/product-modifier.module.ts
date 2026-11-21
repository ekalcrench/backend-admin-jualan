import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductModifierAssignmentController } from './product-modifier-assignment.controller.js';
import { ProductModifierGroupController } from './product-modifier-group.controller.js';
import { ProductModifierOptionController } from './product-modifier-option.controller.js';
import { ProductModifierRepository } from './product-modifier.repository.js';
import { ProductModifierService } from './product-modifier.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProductModifierAssignmentController,
    ProductModifierGroupController,
    ProductModifierOptionController,
  ],
  providers: [ProductModifierRepository, ProductModifierService],
})
export class ProductModifierModule {}
