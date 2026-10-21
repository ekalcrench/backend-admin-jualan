import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { responseInclude } from './constants/response-include.constants.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';

@Injectable()
export class InventoryTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, organizationId } = data;
    const skip = (page - 1) * size;
    const where: Prisma.InventoryTransactionWhereInput = {
      organizationId,
      ...(search && {
        inventoryItem: {
          is: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryTransaction.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['-createdAt'],
        include: responseInclude,
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return { items, total };
  }
}
