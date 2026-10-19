import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryTransactionController } from './inventory-transaction.controller.js';
import { InventoryTransactionRepository } from './inventory-transaction.repository.js';
import { InventoryTransactionService } from './inventory-transaction.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [InventoryTransactionController],
  providers: [InventoryTransactionRepository, InventoryTransactionService],
})
export class InventoryTransactionModule {}
