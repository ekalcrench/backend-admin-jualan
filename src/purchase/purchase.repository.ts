import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';

const purchaseInclude = {
  purchaseItems: {
    include: {
      inventoryItem: {
        select: {
          id: true,
          name: true,
          unit: true,
        },
      },
      inventoryLot: true,
    },
  },
} satisfies Prisma.PurchaseInclude;

@Injectable()
export class PurchaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, organizationId } = data;
    const skip = (page - 1) * size;
    const where: Prisma.PurchaseWhereInput = {
      organizationId,
      ...(search && {
        OR: [
          { supplierName: { contains: search, mode: 'insensitive' } },
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          {
            purchaseItems: {
              some: {
                inventoryItem: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['-purchasedAt'],
        include: purchaseInclude,
      }),
      this.prisma.purchase.count({ where }),
    ]);

    return { items, total };
  }

  findInventoryItemsByIds(organizationId: string, ids: string[]) {
    return this.prisma.inventoryItem.findMany({
      where: { organizationId, id: { in: ids }, isActive: true },
      select: { id: true },
    });
  }

  findById(id: string, organizationId: string) {
    return this.prisma.purchase.findFirst({
      where: { id, organizationId },
      include: purchaseInclude,
    });
  }

  create(data: Prisma.PurchaseCreateInput) {
    return this.prisma.purchase.create({ data, include: purchaseInclude });
  }

  update(id: string, data: Prisma.PurchaseUpdateInput) {
    return this.prisma.purchase.update({
      where: { id },
      data,
      include: purchaseInclude,
    });
  }

  delete(id: string, organizationId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const purchase = await transaction.purchase.findFirst({
        where: { id, organizationId },
        select: { purchaseItems: { select: { id: true } } },
      });

      if (!purchase) {
        return 'not-found' as const;
      }

      const purchaseItemIds = purchase.purchaseItems.map((item) => item.id);
      const lots = purchaseItemIds.length
        ? await transaction.inventoryLot.findMany({
            where: { purchaseItemId: { in: purchaseItemIds } },
            select: {
              id: true,
              _count: { select: { inventoryConsumptions: true } },
            },
          })
        : [];

      if (lots.some((lot) => lot._count.inventoryConsumptions > 0)) {
        return 'consumed' as const;
      }

      if (purchaseItemIds.length) {
        await transaction.inventoryLot.deleteMany({
          where: { purchaseItemId: { in: purchaseItemIds } },
        });
      }

      await transaction.purchase.delete({ where: { id } });
      return 'deleted' as const;
    });
  }
}
