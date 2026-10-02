import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PurchaseController } from './purchase.controller.js';
import { PurchaseRepository } from './purchase.repository.js';
import { PurchaseService } from './purchase.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PurchaseController],
  providers: [PurchaseRepository, PurchaseService],
})
export class PurchaseModule {}
