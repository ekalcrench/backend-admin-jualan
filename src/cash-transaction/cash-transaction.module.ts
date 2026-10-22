import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CashTransactionController } from './cash-transaction.controller.js';
import { CashTransactionRepository } from './cash-transaction.repository.js';
import { CashTransactionService } from './cash-transaction.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [CashTransactionController],
  providers: [CashTransactionRepository, CashTransactionService],
})
export class CashTransactionModule {}
