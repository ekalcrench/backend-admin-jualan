import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryLotController } from './inventory-lot.controller.js';
import { InventoryLotRepository } from './inventory-lot.repository.js';
import { InventoryLotService } from './inventory-lot.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryLotController],
  providers: [InventoryLotRepository, InventoryLotService],
})
export class InventoryLotModule {}
