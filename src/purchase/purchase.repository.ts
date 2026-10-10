import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';
import { PurchaseItemChange } from './types/purchase-item-change.type.js';

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

  update(
    id: string,
    data: Prisma.PurchaseUpdateInput,
    itemChanges: PurchaseItemChange[] = [],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const updateChanges = itemChanges.filter(
        (
          item,
        ): item is PurchaseItemChange & {
          id: string;
          inventoryLotId: string;
        } => item.id !== undefined && item.inventoryLotId !== undefined,
      );
      const updateItemIds = updateChanges.map((item) => item.id);
      const updateLotIds = updateChanges.map((item) => item.inventoryLotId);

      if (
        itemChanges.some(
          (item) =>
            (item.id === undefined) !== (item.inventoryLotId === undefined) ||
            (item.id === undefined && item.createData === undefined),
        ) ||
        new Set(updateItemIds).size !== updateItemIds.length ||
        new Set(updateLotIds).size !== updateLotIds.length
      ) {
        return 'related-record-not-found' as const;
      }

      const existingItemsById = new Map<
        string,
        { quantity: number; totalCost: number }
      >();
      if (updateChanges.length) {
        const existingItems = await transaction.purchaseItem.findMany({
          where: {
            purchaseId: id,
            id: { in: updateItemIds },
          },
          select: {
            id: true,
            quantity: true,
            totalCost: true,
            inventoryLot: { select: { id: true } },
          },
        });
        for (const item of existingItems) {
          existingItemsById.set(item.id, {
            quantity: item.quantity.toNumber(),
            totalCost: item.totalCost.toNumber(),
          });
        }
        const existingItemLotIds = new Map(
          existingItems.map((item) => [item.id, item.inventoryLot?.id]),
        );

        if (
          existingItems.length !== updateChanges.length ||
          updateChanges.some(
            (item) => existingItemLotIds.get(item.id) !== item.inventoryLotId,
          )
        ) {
          return 'related-record-not-found' as const;
        }
      }

      await transaction.purchase.update({
        where: { id },
        data,
      });

      for (const item of itemChanges) {
        if (!item.id) {
          await transaction.purchaseItem.create({
            data: {
              ...item.createData!,
              purchase: { connect: { id } },
            },
          });
          continue;
        }

        const existingItem = existingItemsById.get(item.id)!;

        if (Object.keys(item.purchaseItemData).length) {
          await transaction.purchaseItem.update({
            where: { id: item.id },
            data: item.purchaseItemData,
          });
        }

        const quantity = Number(
          item.purchaseItemData.quantity ?? existingItem.quantity,
        );
        const totalCost = Number(
          item.purchaseItemData.totalCost ?? existingItem.totalCost,
        );
        const inventoryLotData: Prisma.InventoryLotUpdateManyMutationInput = {
          ...item.inventoryLotData,
          ...(item.purchaseItemData.inventoryItemId !== undefined && {
            inventoryItemId: item.purchaseItemData.inventoryItemId,
          }),
          ...((item.purchaseItemData.quantity !== undefined ||
            item.purchaseItemData.totalCost !== undefined) && {
            unitCost: totalCost / quantity,
          }),
        };

        if (Object.keys(inventoryLotData).length) {
          await transaction.inventoryLot.update({
            where: { id: item.inventoryLotId },
            data: inventoryLotData,
          });
        }
      }

      return transaction.purchase.findUniqueOrThrow({
        where: { id },
        include: purchaseInclude,
      });
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
