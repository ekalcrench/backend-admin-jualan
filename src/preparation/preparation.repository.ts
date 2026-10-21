import { Injectable } from '@nestjs/common';
import {
  InventoryTransactionType,
  PreparationStatus,
  Prisma,
} from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';
import { CreatePreparationItemDto } from './dto/create-preparation-item.dto.js';
import { UpdatePreparationItemDto } from './dto/update-preparation-item.dto.js';
import { preparationInclude } from './constants/response-include.constants.js';
import { PreparationItemInput } from './types/preparation-item-input.types.js';
import { PreparationValues } from './types/preparation-values.types.js';
import { PlannedAllocation } from './types/planned-allocation.types.js';
import { PlannedItem } from './types/planned-item.types.js';
import { roundCost } from '../common/constants/round-cost.constants.js';

@Injectable()
export class PreparationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, organizationId } = data;
    const where: Prisma.PreparationWhereInput = {
      organizationId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          {
            outputInventoryItem: {
              name: { contains: search, mode: 'insensitive' },
            },
          },
          {
            items: {
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
    const skip = (page - 1) * size;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.preparation.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['-preparedAt'],
        include: preparationInclude,
      }),
      this.prisma.preparation.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string, organizationId: string) {
    return this.prisma.preparation.findFirst({
      where: { id, organizationId },
      include: preparationInclude,
    });
  }

  create(
    organizationId: string,
    values: PreparationValues & {
      name: string;
      preparedAt: Date;
      outputInventoryItemId: string;
      outputQuantity: Prisma.Decimal;
    },
    items: CreatePreparationItemDto[],
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        const plannedItems = await this.planItems(transaction, items);
        if (!plannedItems) {
          return 'insufficient-stock' as const;
        }

        await this.decreaseLotQuantities(transaction, plannedItems);
        const costs = this.calculateOutputCosts(
          plannedItems,
          values.outputQuantity,
        );
        const preparation = await transaction.preparation.create({
          data: {
            organizationId,
            name: values.name,
            preparedAt: values.preparedAt,
            expiredAt: values.expiredAt,
            notes: values.notes,
            outputInventoryItemId: values.outputInventoryItemId,
            outputQuantity: values.outputQuantity,
            outputUnitCost: costs.unitCost,
            outputTotalCost: costs.totalCost,
          },
        });

        await this.createPreparationItems(
          transaction,
          preparation.id,
          plannedItems,
        );
        return transaction.preparation.findFirstOrThrow({
          where: { id: preparation.id, organizationId },
          include: preparationInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  update(
    id: string,
    organizationId: string,
    values: PreparationValues,
    itemChanges?: UpdatePreparationItemDto[],
    deletedPreparationItemIds: string[] = [],
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        const preparation = await transaction.preparation.findFirst({
          where: { id, organizationId },
          include: {
            outputLot: {
              include: {
                _count: {
                  select: {
                    preparationAllocations: true,
                  },
                },
              },
            },
            items: { include: { allocations: true } },
          },
        });
        if (!preparation) {
          return 'not-found' as const;
        }
        if (preparation.status !== PreparationStatus.DRAFT) {
          return 'not-draft' as const;
        }

        const existingItemsById = new Map(
          preparation.items.map((item) => [item.id, item]),
        );
        const changes = itemChanges ?? [];
        const updateIds = changes
          .map((item) => item.id)
          .filter((itemId): itemId is string => itemId !== undefined);
        if (
          new Set(updateIds).size !== updateIds.length ||
          new Set(deletedPreparationItemIds).size !==
            deletedPreparationItemIds.length ||
          deletedPreparationItemIds.some((itemId) =>
            updateIds.includes(itemId),
          ) ||
          updateIds.some((itemId) => !existingItemsById.has(itemId)) ||
          deletedPreparationItemIds.some(
            (itemId) => !existingItemsById.has(itemId),
          )
        ) {
          return 'related-record-not-found' as const;
        }

        const requestedOutputItemId =
          values.outputInventoryItemId ?? preparation.outputInventoryItemId;
        const requestedOutputQuantity = new Prisma.Decimal(
          values.outputQuantity ?? preparation.outputQuantity,
        );
        const requestedPreparedAt = values.preparedAt ?? preparation.preparedAt;
        const requestedExpiredAt =
          values.expiredAt === undefined
            ? preparation.expiredAt
            : values.expiredAt;
        const requestedStatus = values.status ?? preparation.status;
        const isCompleting =
          preparation.status === PreparationStatus.DRAFT &&
          requestedStatus === PreparationStatus.COMPLETED;
        const hasItemChanges =
          changes.length > 0 || deletedPreparationItemIds.length > 0;
        const outputLotNeedsUpdate =
          isCompleting ||
          hasItemChanges ||
          requestedOutputItemId !== preparation.outputInventoryItemId ||
          !requestedOutputQuantity.equals(preparation.outputQuantity) ||
          requestedPreparedAt.getTime() !== preparation.preparedAt.getTime() ||
          (requestedExpiredAt?.getTime() ?? null) !==
            (preparation.expiredAt?.getTime() ?? null);

        if (
          outputLotNeedsUpdate &&
          preparation.outputLot &&
          (preparation.outputLot.remainingQuantity.lessThan(
            preparation.outputLot.quantity,
          ) ||
            preparation.outputLot._count.preparationAllocations > 0)
        ) {
          return 'output-consumed' as const;
        }

        let plannedItems: PlannedItem[] | undefined;
        if (hasItemChanges) {
          const changedById = new Map(
            changes
              .filter(
                (item): item is UpdatePreparationItemDto & { id: string } =>
                  item.id !== undefined,
              )
              .map((item) => [item.id, item]),
          );
          const mergedItems: PreparationItemInput[] = preparation.items
            .filter((item) => !deletedPreparationItemIds.includes(item.id))
            .map((item) => {
              const change = changedById.get(item.id);
              return {
                id: item.id,
                inventoryItemId:
                  change?.inventoryItemId ?? item.inventoryItemId,
                quantity: change?.quantity ?? item.quantity.toNumber(),
              };
            });
          for (const change of changes) {
            if (!change.id) {
              if (
                change.inventoryItemId === undefined ||
                change.quantity === undefined
              ) {
                return 'related-record-not-found' as const;
              }
              mergedItems.push({
                inventoryItemId: change.inventoryItemId,
                quantity: change.quantity,
              });
            }
          }

          if (!mergedItems.length) {
            return 'empty-preparation' as const;
          }

          plannedItems = await this.planItems(
            transaction,
            mergedItems,
            preparation.items.flatMap((item) =>
              item.allocations.map((allocation) => ({
                inventoryLotId: allocation.inventoryLotId,
                quantity: allocation.quantity,
              })),
            ),
          );
          if (!plannedItems) {
            return 'insufficient-stock' as const;
          }

          for (const item of preparation.items) {
            for (const allocation of item.allocations) {
              await transaction.inventoryLot.update({
                where: { id: allocation.inventoryLotId },
                data: {
                  remainingQuantity: { increment: allocation.quantity },
                },
              });
            }
          }
          await transaction.preparationItem.deleteMany({
            where: { preparationId: id },
          });
          await this.decreaseLotQuantities(transaction, plannedItems);
          await this.createPreparationItems(transaction, id, plannedItems);
        }

        const effectiveItems =
          plannedItems ??
          preparation.items.map((item) => ({
            unitCost: item.unitCost,
            quantity: item.quantity,
            totalCost: item.totalCost,
          }));
        const costs = this.calculateOutputCosts(
          effectiveItems,
          requestedOutputQuantity,
        );

        await transaction.preparation.update({
          where: { id },
          data: {
            ...values,
            outputQuantity: requestedOutputQuantity,
            outputUnitCost: costs.unitCost,
            outputTotalCost: costs.totalCost,
          },
        });

        if (
          requestedStatus === PreparationStatus.COMPLETED &&
          (outputLotNeedsUpdate || !preparation.outputLot)
        ) {
          let outputLotId: string;
          if (preparation.outputLot) {
            outputLotId = preparation.outputLot.id;
            await transaction.inventoryLot.update({
              where: { id: preparation.outputLot.id },
              data: {
                inventoryItemId: requestedOutputItemId,
                quantity: requestedOutputQuantity,
                remainingQuantity: requestedOutputQuantity,
                unitCost: costs.unitCost,
                totalCost: costs.totalCost,
                receivedAt: requestedPreparedAt,
                expiredAt: requestedExpiredAt,
              },
            });
          } else {
            const outputLot = await transaction.inventoryLot.create({
              data: {
                inventoryItemId: requestedOutputItemId,
                purchaseItemId: null,
                preparationOutputId: id,
                quantity: requestedOutputQuantity,
                remainingQuantity: requestedOutputQuantity,
                unitCost: costs.unitCost,
                totalCost: costs.totalCost,
                receivedAt: requestedPreparedAt,
                expiredAt: requestedExpiredAt,
              },
            });
            outputLotId = outputLot.id;
          }
          if (isCompleting) {
            const preparationItems = plannedItems ?? preparation.items;
            await transaction.inventoryTransaction.createMany({
              data: [
                {
                  organizationId,
                  inventoryItemId: requestedOutputItemId,
                  inventoryLotId: outputLotId,
                  type: InventoryTransactionType.PREPARATION_IN,
                  quantity: requestedOutputQuantity,
                  unitCost: costs.unitCost,
                  totalCost: costs.totalCost,
                  referenceId: id,
                },
                ...preparationItems.flatMap((item) =>
                  item.allocations.map((allocation) => ({
                    organizationId,
                    inventoryItemId: item.inventoryItemId,
                    inventoryLotId: allocation.inventoryLotId,
                    type: InventoryTransactionType.PREPARATION_OUT,
                    quantity: allocation.quantity,
                    unitCost: allocation.unitCost,
                    totalCost: allocation.totalCost,
                    referenceId: id,
                  })),
                ),
              ],
            });
          }
        }

        return transaction.preparation.findFirstOrThrow({
          where: { id, organizationId },
          include: preparationInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  complete(id: string, organizationId: string) {
    return this.update(id, organizationId, {
      status: PreparationStatus.COMPLETED,
    });
  }

  delete(id: string, organizationId: string, isOwner: boolean) {
    return this.prisma.$transaction(
      async (transaction) => {
        const preparation = await transaction.preparation.findFirst({
          where: { id, organizationId },
          include: {
            outputLot: {
              include: {
                _count: {
                  select: {
                    preparationAllocations: true,
                  },
                },
              },
            },
            items: { include: { allocations: true } },
          },
        });
        if (!preparation) {
          return 'not-found' as const;
        }
        if (preparation.status === PreparationStatus.COMPLETED && !isOwner) {
          return 'forbidden' as const;
        }
        if (
          preparation.outputLot &&
          (preparation.outputLot.remainingQuantity.lessThan(
            preparation.outputLot.quantity,
          ) ||
            preparation.outputLot._count.preparationAllocations > 0)
        ) {
          return 'output-consumed' as const;
        }

        for (const item of preparation.items) {
          for (const allocation of item.allocations) {
            await transaction.inventoryLot.update({
              where: { id: allocation.inventoryLotId },
              data: { remainingQuantity: { increment: allocation.quantity } },
            });
          }
        }
        await transaction.inventoryTransaction.deleteMany({
          where: {
            organizationId,
            referenceId: id,
            type: {
              in: [
                InventoryTransactionType.PREPARATION_IN,
                InventoryTransactionType.PREPARATION_OUT,
              ],
            },
          },
        });
        if (preparation.outputLot) {
          await transaction.inventoryLot.delete({
            where: { id: preparation.outputLot.id },
          });
        }
        await transaction.preparation.delete({ where: { id } });

        return 'deleted' as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async planItems(
    transaction: Prisma.TransactionClient,
    items: PreparationItemInput[],
    quantitiesToRestore: Array<{
      inventoryLotId: string;
      quantity: Prisma.Decimal;
    }> = [],
  ): Promise<PlannedItem[] | undefined> {
    const inventoryItemIds = [
      ...new Set(items.map((item) => item.inventoryItemId)),
    ];
    const lots = await transaction.inventoryLot.findMany({
      where: { inventoryItemId: { in: inventoryItemIds } },
      orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        inventoryItemId: true,
        remainingQuantity: true,
        unitCost: true,
      },
    });
    const remainingByLotId = new Map(
      lots.map((lot) => [lot.id, lot.remainingQuantity]),
    );
    for (const restore of quantitiesToRestore) {
      const current = remainingByLotId.get(restore.inventoryLotId);
      if (current !== undefined) {
        remainingByLotId.set(
          restore.inventoryLotId,
          current.plus(restore.quantity),
        );
      }
    }

    const planned: PlannedItem[] = [];
    for (const item of items) {
      const quantity = new Prisma.Decimal(item.quantity);
      let quantityNeeded = quantity;
      let weightedCost = new Prisma.Decimal(0);
      const allocations: PlannedAllocation[] = [];
      const itemLots = lots.filter(
        (lot) => lot.inventoryItemId === item.inventoryItemId,
      );

      for (const lot of itemLots) {
        const available = remainingByLotId.get(lot.id)!;
        if (available.lessThanOrEqualTo(0)) {
          continue;
        }
        const consumed = available.lessThan(quantityNeeded)
          ? available
          : quantityNeeded;
        const totalCost = roundCost(lot.unitCost.mul(consumed), 2);
        allocations.push({
          inventoryLotId: lot.id,
          quantity: consumed,
          unitCost: lot.unitCost,
          totalCost,
        });
        weightedCost = weightedCost.plus(lot.unitCost.mul(consumed));
        quantityNeeded = quantityNeeded.minus(consumed);
        remainingByLotId.set(lot.id, available.minus(consumed));
        if (quantityNeeded.equals(0)) {
          break;
        }
      }

      if (!quantityNeeded.equals(0)) {
        return undefined;
      }

      const unitCost = roundCost(weightedCost.div(quantity), 3);
      planned.push({
        ...(item.id && { id: item.id }),
        inventoryItemId: item.inventoryItemId,
        quantity,
        unitCost,
        totalCost: roundCost(unitCost.mul(quantity), 2),
        allocations,
      });
    }

    return planned;
  }

  private async decreaseLotQuantities(
    transaction: Prisma.TransactionClient,
    items: PlannedItem[],
  ) {
    for (const item of items) {
      for (const allocation of item.allocations) {
        const result = await transaction.inventoryLot.updateMany({
          where: {
            id: allocation.inventoryLotId,
            remainingQuantity: { gte: allocation.quantity },
          },
          data: { remainingQuantity: { decrement: allocation.quantity } },
        });
        if (result.count !== 1) {
          throw new Error();
        }
      }
    }
  }

  private async createPreparationItems(
    transaction: Prisma.TransactionClient,
    preparationId: string,
    items: PlannedItem[],
  ) {
    for (const item of items) {
      const firstLotId = item.allocations[0]?.inventoryLotId;
      if (!firstLotId) {
        throw new Error();
      }
      await transaction.preparationItem.create({
        data: {
          ...(item.id && { id: item.id }),
          preparationId,
          inventoryItemId: item.inventoryItemId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.totalCost,
          allocations: {
            create: item.allocations.map((allocation) => ({
              inventoryLotId: allocation.inventoryLotId,
              quantity: allocation.quantity,
              unitCost: allocation.unitCost,
              totalCost: allocation.totalCost,
            })),
          },
        },
      });
    }
  }

  private calculateOutputCosts(
    items: Array<{ totalCost: Prisma.Decimal }>,
    outputQuantity: Prisma.Decimal,
  ) {
    const totalCost = roundCost(
      items.reduce(
        (sum, item) => sum.plus(item.totalCost),
        new Prisma.Decimal(0),
      ),
      2,
    );
    const unitCost = totalCost
      .div(outputQuantity)
      .toDecimalPlaces(3, Prisma.Decimal.ROUND_DOWN);
    return {
      unitCost,
      totalCost,
    };
  }
}
