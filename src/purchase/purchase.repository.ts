import { Injectable } from '@nestjs/common';
import {
  InventoryTransactionType,
  Prisma,
  PurchaseStatus,
} from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';
import { PurchaseItemChange } from './types/purchase-item-change.type.js';
import { responseInclude } from './constants/response-include.constants.js';

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
        include: responseInclude,
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
      include: responseInclude,
    });
  }

  create(data: Prisma.PurchaseCreateInput) {
    return this.prisma.purchase.create({ data, include: responseInclude });
  }

  async finalize(id: string, organizationId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.purchase.updateMany({
        where: {
          id,
          organizationId,
          status: PurchaseStatus.DRAFT,
        },
        data: { status: PurchaseStatus.FINALIZED },
      });

      if (result.count === 0) {
        const purchase = await transaction.purchase.findFirst({
          where: { id, organizationId },
          select: { id: true },
        });

        return purchase ? ('not-draft' as const) : ('not-found' as const);
      }

      const purchase = await transaction.purchase.findFirstOrThrow({
        where: { id, organizationId },
        select: {
          id: true,
          organizationId: true,
          purchaseItems: {
            select: {
              id: true,
              inventoryItemId: true,
              quantity: true,
              packageSize: true,
              totalCost: true,
              receivedAt: true,
              expiredAt: true,
              inventoryLot: {
                select: { id: true, unitCost: true, totalCost: true },
              },
            },
          },
        },
      });

      const inventoryTransactions: Prisma.InventoryTransactionCreateManyInput[] =
        [];
      for (const item of purchase.purchaseItems) {
        const totalQuantity = item.packageSize.mul(item.quantity);
        const inventoryLot =
          item.inventoryLot ??
          (await transaction.inventoryLot.create({
            data: {
              inventoryItemId: item.inventoryItemId,
              purchaseItemId: item.id,
              quantity: totalQuantity,
              remainingQuantity: totalQuantity,
              unitCost: item.totalCost.div(totalQuantity),
              totalCost: item.totalCost,
              receivedAt: item.receivedAt,
              expiredAt: item.expiredAt,
            },
          }));
        inventoryTransactions.push({
          organizationId: purchase.organizationId,
          inventoryItemId: item.inventoryItemId,
          inventoryLotId: inventoryLot.id,
          type: InventoryTransactionType.PURCHASE,
          quantity: totalQuantity,
          unitCost: inventoryLot.unitCost,
          totalCost: inventoryLot.totalCost,
          referenceId: purchase.id,
        });
      }

      if (inventoryTransactions.length) {
        await transaction.inventoryTransaction.createMany({
          data: inventoryTransactions,
        });
      }

      return transaction.purchase.findFirstOrThrow({
        where: { id, organizationId },
        include: responseInclude,
      });
    });
  }

  update(
    id: string,
    data: Prisma.PurchaseUpdateInput,
    itemChanges: PurchaseItemChange[] = [],
    deletedPurchaseItemIds: string[] = [],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const updateChanges = itemChanges.filter(
        (item): item is PurchaseItemChange & { id: string } =>
          item.id !== undefined,
      );
      const updateItemIds = updateChanges.map((item) => item.id);

      if (
        itemChanges.some(
          (item) => item.id === undefined && item.createData === undefined,
        ) ||
        new Set(updateItemIds).size !== updateItemIds.length ||
        deletedPurchaseItemIds.some((itemId) => updateItemIds.includes(itemId))
      ) {
        return 'related-record-not-found' as const;
      }

      if (updateChanges.length) {
        const existingItems = await transaction.purchaseItem.findMany({
          where: {
            purchaseId: id,
            id: { in: updateItemIds },
          },
          select: {
            id: true,
            inventoryLot: {
              select: {
                id: true,
                quantity: true,
                remainingQuantity: true,
                _count: {
                  select: {
                    preparationAllocations: true,
                  },
                },
              },
            },
          },
        });

        if (existingItems.length !== updateChanges.length) {
          return 'related-record-not-found' as const;
        }
        if (
          existingItems.some(
            (item) =>
              item.inventoryLot &&
              (item.inventoryLot.remainingQuantity.lessThan(
                item.inventoryLot.quantity,
              ) ||
                item.inventoryLot._count.preparationAllocations > 0),
          )
        ) {
          return 'consumed' as const;
        }
      }

      if (deletedPurchaseItemIds.length) {
        const itemsToDelete = await transaction.purchaseItem.findMany({
          where: {
            purchaseId: id,
            id: { in: deletedPurchaseItemIds },
          },
          select: { id: true },
        });

        if (itemsToDelete.length !== deletedPurchaseItemIds.length) {
          return 'related-record-not-found' as const;
        }

        const lotsToDelete = await transaction.inventoryLot.findMany({
          where: { purchaseItemId: { in: deletedPurchaseItemIds } },
          select: {
            quantity: true,
            remainingQuantity: true,
            _count: {
              select: {
                preparationAllocations: true,
              },
            },
          },
        });

        if (
          lotsToDelete.some(
            (lot) =>
              lot.remainingQuantity.lessThan(lot.quantity) ||
              lot._count.preparationAllocations > 0,
          )
        ) {
          return 'consumed' as const;
        }
        if (lotsToDelete.length > 0) {
          return 'inventory-lots-exist' as const;
        }
      }

      const purchaseUpdate = await transaction.purchase.updateMany({
        where: { id, status: PurchaseStatus.DRAFT },
        data,
      });

      if (purchaseUpdate.count === 0) {
        const purchase = await transaction.purchase.findUnique({
          where: { id },
          select: { id: true },
        });

        return purchase ? ('finalized' as const) : ('not-found' as const);
      }

      if (deletedPurchaseItemIds.length) {
        await transaction.purchaseItem.deleteMany({
          where: {
            purchaseId: id,
            id: { in: deletedPurchaseItemIds },
          },
        });
      }

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

        if (Object.keys(item.purchaseItemData).length) {
          await transaction.purchaseItem.update({
            where: { id: item.id },
            data: item.purchaseItemData,
          });
        }
      }

      return transaction.purchase.findUniqueOrThrow({
        where: { id },
        include: responseInclude,
      });
    });
  }

  delete(id: string, organizationId: string, isOwner: boolean) {
    return this.prisma.$transaction(async (transaction) => {
      const purchase = await transaction.purchase.findFirst({
        where: { id, organizationId },
        select: { status: true, purchaseItems: { select: { id: true } } },
      });

      if (!purchase) {
        return 'not-found' as const;
      }

      if (purchase.status === PurchaseStatus.FINALIZED && !isOwner) {
        return 'forbidden' as const;
      }

      const deleteGuard = await transaction.purchase.updateMany({
        where: { id, organizationId, status: purchase.status },
        data: { status: purchase.status },
      });

      if (deleteGuard.count === 0) {
        const currentPurchase = await transaction.purchase.findFirst({
          where: { id, organizationId },
          select: { status: true },
        });

        if (!currentPurchase) {
          return 'not-found' as const;
        }
        if (currentPurchase.status === PurchaseStatus.FINALIZED && !isOwner) {
          return 'forbidden' as const;
        }

        return 'status-changed' as const;
      }

      const purchaseItemIds = purchase.purchaseItems.map((item) => item.id);
      const lots = purchaseItemIds.length
        ? await transaction.inventoryLot.findMany({
            where: { purchaseItemId: { in: purchaseItemIds } },
            select: {
              id: true,
              quantity: true,
              remainingQuantity: true,
              _count: {
                select: {
                  preparationAllocations: true,
                },
              },
            },
          })
        : [];

      if (lots.some((lot) => lot.remainingQuantity.lessThan(lot.quantity))) {
        return 'consumed' as const;
      }
      if (lots.some((lot) => lot._count.preparationAllocations > 0)) {
        return 'preparation-records-exist' as const;
      }

      await transaction.inventoryTransaction.deleteMany({
        where: {
          organizationId,
          referenceId: id,
          type: InventoryTransactionType.PURCHASE,
        },
      });

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
