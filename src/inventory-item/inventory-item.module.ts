import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryItemController } from './inventory-item.controller.js';
import { InventoryItemRepository } from './inventory-item.repository.js';
import { InventoryItemService } from './inventory-item.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryItemController],
  providers: [InventoryItemRepository, InventoryItemService],
})
export class InventoryItemModule {}
