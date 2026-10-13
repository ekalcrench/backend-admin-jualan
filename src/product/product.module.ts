import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ProductController } from './product.controller.js';
import { ProductRepository } from './product.repository.js';
import { ProductService } from './product.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [ProductController],
  providers: [ProductRepository, ProductService],
})
export class ProductModule {}
