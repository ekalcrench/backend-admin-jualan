import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GetInventoryLotsByPagesDto } from './dto/get-inventory-lots-by-pages.dto.js';
import { inventoryLotSortMap } from './constants/sort-map.constants.js';

@Injectable()
export class InventoryLotRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: GetInventoryLotsByPagesDto, organizationId: string) {
    const { page, size, sortBy, inventoryItemId, search } = data;
    const skip = (page - 1) * size;
    const where: Prisma.InventoryLotWhereInput = {
      inventoryItem: {
        is: { id: inventoryItemId, organizationId, isActive: true },
      },
      ...(search && {
        purchaseItem: {
          is: {
            purchase: {
              is: {
                invoiceNumber: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            },
          },
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryLot.findMany({
        skip,
        take: size,
        where,
        orderBy:
          inventoryLotSortMap[sortBy] ?? inventoryLotSortMap['-receivedAt'],
        include: {
          purchaseItem: {
            select: {
              purchase: {
                select: { invoiceNumber: true },
              },
            },
          },
        },
      }),
      this.prisma.inventoryLot.count({ where }),
    ]);

    return { items, total };
  }
}
