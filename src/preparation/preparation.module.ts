import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PreparationController } from './preparation.controller.js';
import { PreparationRepository } from './preparation.repository.js';
import { PreparationService } from './preparation.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [PreparationController],
  providers: [PreparationRepository, PreparationService],
})
export class PreparationModule {}
