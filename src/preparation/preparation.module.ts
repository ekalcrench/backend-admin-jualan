import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PreparationController } from './preparation.controller.js';
import { PreparationRepository } from './preparation.repository.js';
import { PreparationService } from './preparation.service.js';
import { InventoryItemModule } from '../inventory-item/inventory-item.module.js';

@Module({
  imports: [PrismaModule, InventoryItemModule],
  controllers: [PreparationController],
  providers: [PreparationRepository, PreparationService],
})
export class PreparationModule {}
