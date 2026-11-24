/* eslint-disable @typescript-eslint/no-empty-object-type */
import { Injectable } from '@nestjs/common';
import {
  CashTransactionType,
  CostingStatus,
  InventoryPolicy,
  InventoryTransactionType,
  OrderStatus,
  OrderType,
  ProductStockManagement,
  Prisma,
} from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import type { FindByPagesParams } from './types/find-by-pages-params.types.js';
import type { OrderItemChange } from './types/order-item-change.type.js';
import { responseInclude } from './constants/response-include.constants.js';
import { roundCost } from '../common/constants/round-cost.constants.js';
import type { DineInOrderWithTable } from './types/dine-in-order-with-table.types.js';
import type { OrderTypeDetails } from './types/order-type-details.types.js';
import type { OrderWithDetails } from './types/order-with-details.types.js';
import type { OrderQueryRecord } from './types/order-query-record.types.js';
import { calculateOrderTotals } from './order-totals.helper.js';
import { ProductModifierOrderingService } from '../product-modifier/product-modifier-ordering.service.js';
import { OrderModifierValidationError } from '../product-modifier/errors/order-modifier-validation.error.js';
import type { ResolvedOrderModifierItem } from '../product-modifier/types/product-modifier-ordering.types.js';

export class InsufficientOrderInventoryError extends Error {
  constructor(inventoryItemName: string) {
    super(`Stok untuk "${inventoryItemName}" tidak mencukupi`);
    this.name = 'InsufficientOrderInventoryError';
  }
}

export class InsufficientManualProductStockError extends Error {
  constructor(productName: string) {
    super(`Stok untuk produk "${productName}" tidak mencukupi`);
    this.name = 'InsufficientManualProductStockError';
  }
}

export class InvalidManualProductStockError extends Error {
  constructor(productName: string) {
    super(`Stok manual untuk produk "${productName}" belum dikonfigurasi`);
    this.name = 'InvalidManualProductStockError';
  }
}

/**
 * Raised when an order (or one of its modifier snapshots) references an
 * inventory item that no longer exists in the organization. Deducting another
 * organization's stock or silently skipping the deduction would corrupt stock
 * levels, so finalization fails and the transaction rolls back.
 */
export class OrderInventoryReferenceError extends Error {
  constructor() {
    super('Salah satu barang inventaris pada pesanan tidak lagi tersedia');
    this.name = 'OrderInventoryReferenceError';
  }
}

type InventoryLineInput = {
  quantity: number;
  productTrackInventory: boolean;
  productInventoryPolicy: InventoryPolicy;
  productIngredients: Array<{
    inventoryItemId: string;
    quantity: Prisma.Decimal;
  }>;
  modifiers: Array<{
    inventoryItemId: string | null;
    inventoryQuantity: Prisma.Decimal | null;
    trackInventory: boolean;
    inventoryPolicy: InventoryPolicy;
  }>;
};

type PlannedInventoryConsumption = {
  inventoryItemId: string;
  inventoryLotId: string | null;
  quantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
};

type PreparedInventoryPlan = {
  costs: Array<{ unitCost: Prisma.Decimal; costingStatus: CostingStatus }>;
  lotUpdates: Array<{
    id: string;
    initialQuantity: Prisma.Decimal;
    remainingQuantity: Prisma.Decimal;
    inventoryItemId: string;
  }>;
  consumptions: PlannedInventoryConsumption[];
};

@Injectable()
export class OrderRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productModifierOrdering: ProductModifierOrderingService,
  ) {}

  getOverviewItems(organizationId: string, startDate?: Date, endDate?: Date) {
    const createdAt: { gte?: Date; lt?: Date } = {};
    if (startDate) {
      createdAt.gte = startDate;
    }
    if (endDate) {
      const endDateExclusive = new Date(endDate);
      endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1);
      createdAt.lt = endDateExclusive;
    }

    return this.prisma.orderItem.findMany({
      where: {
        order: {
          is: {
            organizationId,
            status: OrderStatus.PAID,
            ...(startDate || endDate ? { createdAt } : {}),
          },
        },
      },
      select: {
        productId: true,
        quantity: true,
        product: { select: { name: true } },
        order: { select: { createdAt: true } },
      },
    });
  }

  getOverviewWithoutDateRange(organizationId: string) {
    return Promise.all([
      this.prisma.order.aggregate({
        where: { organizationId, status: OrderStatus.PAID },
        _sum: { totalAmount: true, totalQuantity: true },
      }),
      this.getTotalUnitCost({
        organizationId,
      }),
    ]);
  }

  getOverviewWithDateRange(
    organizationId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const currentEndExclusive = new Date(endDate);
    currentEndExclusive.setUTCDate(currentEndExclusive.getUTCDate() + 1);

    const periodDuration = currentEndExclusive.getTime() - startDate.getTime();
    const previousStart = new Date(startDate.getTime() - periodDuration);

    return Promise.all([
      this.prisma.order.aggregate({
        where: {
          organizationId,
          status: OrderStatus.PAID,
          createdAt: { gte: startDate, lt: currentEndExclusive },
        },
        _sum: {
          totalAmount: true,
          totalQuantity: true,
        },
      }),
      this.prisma.order.aggregate({
        where: {
          organizationId,
          status: OrderStatus.PAID,
          createdAt: { gte: previousStart, lt: startDate },
        },
        _sum: {
          totalAmount: true,
          totalQuantity: true,
        },
      }),
      this.getTotalUnitCost({
        organizationId,
        createdAt: { gte: startDate, lt: currentEndExclusive },
      }),
      this.getTotalUnitCost({
        organizationId,
        createdAt: { gte: previousStart, lt: startDate },
      }),
    ]);
  }

  private async getTotalUnitCost(
    where: Prisma.OrderWhereInput,
  ): Promise<Prisma.Decimal | null> {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { is: { ...where, status: OrderStatus.PAID } } },
      select: { quantity: true, unitCost: true, costingStatus: true },
    });
    if (items.some((item) => item.costingStatus === CostingStatus.UNKNOWN)) {
      return null;
    }

    return items.reduce(
      (total, item) => total.plus(item.unitCost.mul(item.quantity)),
      new Prisma.Decimal(0),
    );
  }

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, startDate, endDate, organizationId } =
      data;
    const skip = (page - 1) * size;
    const where: Prisma.OrderWhereInput = {
      organizationId,
      ...(search && {
        OR: [
          { orderNumber: { contains: search, mode: 'insensitive' } },
          {
            items: {
              some: {
                product: { name: { contains: search, mode: 'insensitive' } },
              },
            },
          },
        ],
      }),
    };

    if (startDate || endDate) {
      const createdAt: { gte?: Date; lt?: Date } = {};
      if (startDate) {
        createdAt.gte = startDate;
      }
      if (endDate) {
        const endDateExclusive = new Date(endDate);
        endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1);
        createdAt.lt = endDateExclusive;
      }
      where.createdAt = createdAt;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        skip,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['-createdAt'],
        include: responseInclude,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items: await this.withOrderDetails(items), total };
  }

  async findById(id: string, organizationId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, organizationId },
      include: responseInclude,
    });
    if (!order) {
      return null;
    }

    return (await this.withOrderDetails([order]))[0];
  }

  findOrderType(id: string, organizationId: string) {
    return this.prisma.order.findFirst({
      where: { id, organizationId },
      select: { status: true, type: true },
    });
  }

  async markPaid(id: string, organizationId: string) {
    const result = await this.prisma.$transaction(
      async (transaction) => {
        const orderBeforePayment = await transaction.order.findFirst({
          where: { id, organizationId },
          select: { id: true, status: true, inventoryDeducted: true },
        });
        if (!orderBeforePayment) {
          return 'not-found' as const;
        }
        if (orderBeforePayment.status === OrderStatus.PAID) {
          return 'already-paid' as const;
        }
        const orderItemsBeforePayment = await transaction.orderItem.findMany({
          where: { orderId: id },
          select: { productId: true },
        });
        await this.lockProducts(
          transaction,
          organizationId,
          orderItemsBeforePayment.map((item) => item.productId),
        );

        const result = await transaction.order.updateMany({
          where: { id, organizationId, status: OrderStatus.UNPAID },
          data: { status: OrderStatus.PAID },
        });

        if (result.count === 1) {
          if (!orderBeforePayment.inventoryDeducted) {
            await this.applyOrderInventory(
              transaction,
              organizationId,
              id,
              false,
            );
            await this.applyOrderManualStock(transaction, organizationId, id);
            await transaction.order.update({
              where: { id },
              data: { inventoryDeducted: true },
            });
          }
          const order = await transaction.order.findFirstOrThrow({
            where: { id, organizationId },
            include: responseInclude,
          });
          await transaction.cashTransaction.create({
            data: {
              organizationId,
              type: CashTransactionType.SALE,
              amount: order.totalAmount,
              description: `Sale from order ${order.orderNumber}`,
              referenceId: order.id,
            },
          });
          return order;
        }

        const order = await transaction.order.findFirst({
          where: { id, organizationId },
          select: { id: true },
        });
        return order ? ('already-paid' as const) : ('not-found' as const);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    if (typeof result === 'string') {
      return result;
    }

    return (await this.withOrderDetails([result]))[0];
  }

  findProductsByIds(organizationId: string, ids: string[]) {
    return this.prisma.product.findMany({
      where: { organizationId, id: { in: ids } },
      select: { id: true, sellingPrice: true },
    });
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
  }

  async create(
    organizationId: string,
    orderNumber: string,
    cashierId: string,
    customerId: string | undefined,
    type: OrderType,
    details: OrderTypeDetails,
    orderItems: Array<{
      productId: string;
      quantity: number;
      modifierOptionIds?: string[];
    }>,
  ) {
    return this.prisma
      .$transaction(
        async (transaction) => {
          await this.lockProducts(
            transaction,
            organizationId,
            orderItems.map((item) => item.productId),
          );
          const resolvedItems =
            await this.productModifierOrdering.resolveOrderItems(
              transaction,
              organizationId,
              orderItems.map((item) => ({
                productId: item.productId,
                modifierOptionIds: item.modifierOptionIds ?? [],
              })),
            );
          const inventoryPlan = await this.prepareOrderInventoryAndCosts(
            transaction,
            organizationId,
            resolvedItems.map((resolved, index) => ({
              quantity: orderItems[index].quantity,
              productTrackInventory:
                resolved.stockManagement === ProductStockManagement.INVENTORY,
              productInventoryPolicy: resolved.inventoryPolicy,
              productIngredients: resolved.productIngredients,
              modifiers: resolved.modifierSnapshots ?? [],
            })),
          );

          const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
          let totalAmount = new Prisma.Decimal(0);
          let totalQuantity = 0;

          for (const [index, resolved] of resolvedItems.entries()) {
            const quantity = orderItems[index].quantity;
            const { unitCost, costingStatus } = inventoryPlan.costs[index];

            const modifierSnapshots = resolved.modifierSnapshots ?? [];
            items.push({
              product: { connect: { id: resolved.productId } },
              quantity,
              unitPrice: resolved.sellingPrice,
              unitCost,
              costingStatus,
              manualStockDeducted:
                resolved.stockManagement === ProductStockManagement.MANUAL,
              ...(modifierSnapshots.length && {
                modifiers: { create: modifierSnapshots },
              }),
            });
            totalAmount = totalAmount.plus(
              resolved.sellingPrice.plus(resolved.modifierTotal).mul(quantity),
            );
            totalQuantity += quantity;
          }

          const typeDetailsResult = await this.createOrderTypeDetails(
            transaction,
            organizationId,
            type,
            details,
          );
          if ('error' in typeDetailsResult) {
            return typeDetailsResult.error;
          }

          const order = await transaction.order.create({
            data: {
              orderNumber,
              type,
              referenceId: typeDetailsResult.referenceId,
              totalAmount,
              totalQuantity,
              status: OrderStatus.UNPAID,
              inventoryDeducted: true,
              organization: { connect: { id: organizationId } },
              cashier: { connect: { id: cashierId } },
              ...(customerId && {
                customer: { connect: { id: customerId } },
              }),
              items: { create: items },
            },
            include: responseInclude,
          });
          await this.commitOrderInventory(
            transaction,
            organizationId,
            order.id,
            inventoryPlan,
          );
          await this.applyOrderManualStock(
            transaction,
            organizationId,
            order.id,
          );
          return order;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .then(async (result) =>
        typeof result === 'string'
          ? result
          : (await this.withOrderDetails([result]))[0],
      );
  }

  async update(
    id: string,
    organizationId: string,
    data: Prisma.OrderUncheckedUpdateManyInput,
    itemChanges: OrderItemChange[] = [],
    deletedOrderItemIds: string[] = [],
    details: OrderTypeDetails = {},
  ) {
    return this.prisma
      .$transaction(
        async (transaction) => {
          const order = await transaction.order.findFirst({
            where: { id, organizationId },
            select: {
              id: true,
              status: true,
              type: true,
              referenceId: true,
              inventoryDeducted: true,
            },
          });
          if (!order) {
            return 'not-found' as const;
          }
          if (order.status === OrderStatus.PAID) {
            return 'paid' as const;
          }

          const itemsBeforeUpdate = await transaction.orderItem.findMany({
            where: { orderId: id },
            select: {
              id: true,
              productId: true,
              quantity: true,
              manualStockDeducted: true,
            },
          });
          const existingProductIdByItemId = new Map(
            itemsBeforeUpdate.map((item) => [item.id, item.productId]),
          );
          await this.lockProducts(transaction, organizationId, [
            ...itemsBeforeUpdate.map((item) => item.productId),
            ...itemChanges
              .map(
                (item) =>
                  item.productId ??
                  (item.id
                    ? existingProductIdByItemId.get(item.id)
                    : undefined),
              )
              .filter(
                (productId): productId is string => productId !== undefined,
              ),
          ]);

          const updateChanges = itemChanges.filter(
            (item): item is OrderItemChange & { id: string } =>
              item.id !== undefined,
          );
          const updateIds = updateChanges.map((item) => item.id);

          if (
            new Set(updateIds).size !== updateIds.length ||
            new Set(deletedOrderItemIds).size !== deletedOrderItemIds.length ||
            deletedOrderItemIds.some((itemId) => updateIds.includes(itemId))
          ) {
            return 'related-record-not-found' as const;
          }

          let existingItems: Array<{
            id: string;
            productId: string;
            quantity: number;
            modifiers: Array<{ modifierOptionId: string | null }>;
          }> = [];
          if (updateIds.length) {
            existingItems = await transaction.orderItem.findMany({
              where: { orderId: id, id: { in: updateIds } },
              select: {
                id: true,
                productId: true,
                quantity: true,
                modifiers: { select: { modifierOptionId: true } },
              },
            });
            if (existingItems.length !== updateIds.length) {
              return 'related-record-not-found' as const;
            }
          }

          const existingById = new Map(
            existingItems.map((item) => [item.id, item]),
          );
          const changeMeta = new Map<
            OrderItemChange,
            {
              productId: string;
              quantity: number;
              modifierOptionIds: string[] | null;
            }
          >();

          for (const item of itemChanges) {
            const existing = item.id ? existingById.get(item.id) : undefined;
            if (item.id && !existing) {
              return 'related-record-not-found' as const;
            }

            const targetProductId = item.productId ?? existing?.productId;
            const targetQuantity = item.quantity ?? existing?.quantity;
            if (!targetProductId || targetQuantity === undefined) {
              return 'related-record-not-found' as const;
            }

            const productChanged =
              item.productId !== undefined &&
              existing !== undefined &&
              item.productId !== existing.productId;
            let modifierOptionIds: string[] | null;

            if (item.modifierOptionIds !== undefined) {
              modifierOptionIds = item.modifierOptionIds;
            } else if (!existing) {
              modifierOptionIds = [];
            } else if (productChanged) {
              const historicalOptionIds = existing.modifiers.map(
                (modifier) => modifier.modifierOptionId,
              );
              if (historicalOptionIds.some((optionId) => optionId === null)) {
                throw new OrderModifierValidationError(
                  'modifier-option-invalid',
                  'Modifier selections must be provided again when changing the product because a historical modifier option no longer exists',
                );
              }
              modifierOptionIds = historicalOptionIds as string[];
            } else {
              modifierOptionIds = null;
            }

            changeMeta.set(item, {
              productId: targetProductId,
              quantity: targetQuantity,
              modifierOptionIds,
            });
          }

          const resolvedItems =
            await this.productModifierOrdering.resolveOrderItems(
              transaction,
              organizationId,
              itemChanges.map((item) => {
                const meta = changeMeta.get(item)!;

                return {
                  productId: meta.productId,
                  modifierOptionIds: meta.modifierOptionIds,
                };
              }),
            );
          const unitCosts = await this.getProductUnitCosts(
            transaction,
            organizationId,
            resolvedItems.map((resolved, index) => ({
              quantity: changeMeta.get(itemChanges[index])!.quantity,
              productIngredients: resolved.productIngredients,
              modifiers: resolved.modifierSnapshots ?? [],
            })),
          );

          const pricedChanges: Array<{
            item: OrderItemChange;
            quantity: number;
            resolved: ResolvedOrderModifierItem;
            unitCost: Prisma.Decimal;
            costingStatus: CostingStatus;
          }> = [];
          for (const [index, item] of itemChanges.entries()) {
            const meta = changeMeta.get(item)!;
            const resolved = resolvedItems[index];
            const { unitCost, costingStatus } = unitCosts[index];

            pricedChanges.push({
              item,
              quantity: meta.quantity,
              resolved,
              unitCost,
              costingStatus,
            });
          }

          if (deletedOrderItemIds.length) {
            const itemsToDelete = await transaction.orderItem.findMany({
              where: { orderId: id, id: { in: deletedOrderItemIds } },
              select: { id: true },
            });
            if (itemsToDelete.length !== deletedOrderItemIds.length) {
              return 'related-record-not-found' as const;
            }
          }

          const orderGuard = await transaction.order.updateMany({
            where: { id, organizationId, status: OrderStatus.UNPAID },
            data: { status: OrderStatus.UNPAID },
          });
          if (orderGuard.count === 0) {
            const currentOrder = await transaction.order.findFirst({
              where: { id, organizationId },
              select: { id: true },
            });
            return currentOrder ? ('paid' as const) : ('not-found' as const);
          }

          const targetType: OrderType =
            typeof data.type === 'object' && data.type !== null
              ? (data.type.set ?? order.type)
              : (data.type ?? order.type);
          const typeChanged = targetType !== order.type;
          const hasDetails = this.hasOrderTypeDetails(details, targetType);
          let referenceId = order.referenceId;

          if (typeChanged) {
            const typeDetailsResult = await this.createOrderTypeDetails(
              transaction,
              organizationId,
              targetType,
              details,
            );
            if ('error' in typeDetailsResult) {
              return typeDetailsResult.error;
            }
            referenceId = typeDetailsResult.referenceId;
          } else if (hasDetails) {
            const updateResult = await this.updateOrderTypeDetails(
              transaction,
              organizationId,
              targetType,
              order.referenceId,
              details,
            );
            if (updateResult) {
              return updateResult;
            }
          }

          if (typeChanged) {
            await this.deleteOrderTypeDetails(
              transaction,
              order.type,
              order.referenceId,
            );
          }

          const orderUpdate = await transaction.order.updateMany({
            where: { id, organizationId, status: OrderStatus.UNPAID },
            data: {
              ...data,
              type: targetType,
              referenceId,
              status: OrderStatus.UNPAID,
            },
          });
          if (orderUpdate.count !== 1) {
            throw new Error('Order changed while the update was in progress');
          }

          if (deletedOrderItemIds.length) {
            await transaction.orderItem.deleteMany({
              where: { orderId: id, id: { in: deletedOrderItemIds } },
            });
          }

          for (const {
            item,
            quantity,
            resolved,
            unitCost,
            costingStatus,
          } of pricedChanges) {
            const modifierSnapshots = resolved.modifierSnapshots;

            if (item.id) {
              const orderItemId = item.id;
              await transaction.orderItem.update({
                where: { id: orderItemId },
                data: {
                  ...item.itemData,
                  quantity,
                  unitPrice: resolved.sellingPrice,
                  unitCost,
                  costingStatus,
                },
              });

              if (modifierSnapshots !== undefined) {
                await transaction.orderItemModifier.deleteMany({
                  where: { orderItemId },
                });

                if (modifierSnapshots.length) {
                  await transaction.orderItemModifier.createMany({
                    data: modifierSnapshots.map((modifier) => ({
                      orderItemId,
                      ...modifier,
                    })),
                  });
                }
              }
            } else if (item.createData) {
              await transaction.orderItem.create({
                data: {
                  ...item.createData,
                  quantity,
                  unitPrice: resolved.sellingPrice,
                  unitCost,
                  costingStatus,
                  order: { connect: { id } },
                  ...(modifierSnapshots?.length && {
                    modifiers: { create: modifierSnapshots },
                  }),
                },
              });
            }
          }

          const currentItems = await transaction.orderItem.findMany({
            where: { orderId: id },
            select: {
              quantity: true,
              unitPrice: true,
              modifiers: { select: { unitPrice: true } },
            },
          });
          const { totalAmount, totalQuantity } =
            calculateOrderTotals(currentItems);

          await transaction.order.update({
            where: { id },
            data: { totalAmount, totalQuantity },
          });

          if (itemChanges.length || deletedOrderItemIds.length) {
            await this.restoreOrderManualStock(
              transaction,
              organizationId,
              itemsBeforeUpdate,
            );
            if (order.inventoryDeducted) {
              await this.restoreOrderInventory(transaction, organizationId, id);
            }
            await this.applyOrderInventory(transaction, organizationId, id);
            await this.applyOrderManualStock(transaction, organizationId, id);
            await transaction.order.update({
              where: { id },
              data: { inventoryDeducted: true },
            });
          }

          return transaction.order.findFirstOrThrow({
            where: { id, organizationId },
            include: responseInclude,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .then(async (result) =>
        typeof result === 'string'
          ? result
          : (await this.withOrderDetails([result]))[0],
      );
  }

  delete(id: string, organizationId: string) {
    return this.prisma.$transaction(
      async (transaction) => {
        const order = await transaction.order.findFirst({
          where: { id, organizationId },
          select: {
            id: true,
            status: true,
            type: true,
            referenceId: true,
          },
        });
        if (!order) {
          return 'not-found' as const;
        }
        if (order.status === OrderStatus.PAID) {
          return 'paid' as const;
        }

        const orderItems = await transaction.orderItem.findMany({
          where: { orderId: id },
          select: {
            productId: true,
            quantity: true,
            manualStockDeducted: true,
          },
        });
        await this.lockProducts(
          transaction,
          organizationId,
          orderItems.map((item) => item.productId),
        );

        const orderUpdate = await transaction.order.updateMany({
          where: { id, organizationId, status: OrderStatus.UNPAID },
          data: { status: OrderStatus.UNPAID },
        });
        if (orderUpdate.count === 0) {
          const currentOrder = await transaction.order.findFirst({
            where: { id, organizationId },
            select: { id: true },
          });
          return currentOrder ? ('paid' as const) : ('not-found' as const);
        }

        const orderInventory = await transaction.order.findFirstOrThrow({
          where: { id, organizationId },
          select: { inventoryDeducted: true },
        });
        if (orderInventory.inventoryDeducted) {
          await this.restoreOrderInventory(transaction, organizationId, id);
        }
        await this.restoreOrderManualStock(
          transaction,
          organizationId,
          orderItems,
        );

        await transaction.orderItem.deleteMany({
          where: { orderId: id },
        });
        await this.deleteOrderTypeDetails(
          transaction,
          order.type,
          order.referenceId,
        );
        await transaction.order.delete({
          where: { id, organizationId, status: OrderStatus.UNPAID },
        });
        return 'deleted' as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async withOrderDetails(orders: OrderQueryRecord[]) {
    const deliveryIds = orders
      .filter((order) => order.type === OrderType.DELIVERY)
      .map((order) => order.referenceId);
    const takeawayIds = orders
      .filter((order) => order.type === OrderType.TAKEAWAY)
      .map((order) => order.referenceId);
    const dineInIds = orders
      .filter((order) => order.type === OrderType.DINE_IN)
      .map((order) => order.referenceId);

    const [deliveryOrders, takeawayOrders, dineInOrders]: [
      Prisma.DeliveryOrderGetPayload<{}>[],
      Prisma.TakeawayOrderGetPayload<{}>[],
      DineInOrderWithTable[],
    ] = await Promise.all([
      deliveryIds.length
        ? this.prisma.deliveryOrder.findMany({
            where: { id: { in: deliveryIds } },
          })
        : Promise.resolve([]),
      takeawayIds.length
        ? this.prisma.takeawayOrder.findMany({
            where: { id: { in: takeawayIds } },
          })
        : Promise.resolve([]),
      dineInIds.length
        ? this.prisma.dineInOrder.findMany({
            where: { id: { in: dineInIds } },
            include: {
              table: {
                select: {
                  id: true,
                  tableNumber: true,
                  name: true,
                  capacity: true,
                  status: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const deliveryById = new Map<string, Prisma.DeliveryOrderGetPayload<{}>>(
      deliveryOrders.map(
        (detail): [string, Prisma.DeliveryOrderGetPayload<{}>] => [
          detail.id,
          detail,
        ],
      ),
    );
    const takeawayById = new Map<string, Prisma.TakeawayOrderGetPayload<{}>>(
      takeawayOrders.map(
        (detail): [string, Prisma.TakeawayOrderGetPayload<{}>] => [
          detail.id,
          detail,
        ],
      ),
    );
    const dineInById = new Map<string, DineInOrderWithTable>(
      dineInOrders.map((detail): [string, DineInOrderWithTable] => [
        detail.id,
        detail,
      ]),
    );

    return orders.map((order): OrderWithDetails => ({
      ...order,
      deliveryOrder:
        order.type === OrderType.DELIVERY
          ? (deliveryById.get(order.referenceId) ?? null)
          : null,
      takeawayOrder:
        order.type === OrderType.TAKEAWAY
          ? (takeawayById.get(order.referenceId) ?? null)
          : null,
      dineInOrder:
        order.type === OrderType.DINE_IN
          ? (dineInById.get(order.referenceId) ?? null)
          : null,
    }));
  }

  private hasOrderTypeDetails(
    details: OrderTypeDetails,
    type: OrderType,
  ): boolean {
    switch (type) {
      case OrderType.DELIVERY:
        return details.deliveryOrder !== undefined;
      case OrderType.TAKEAWAY:
        return details.takeawayOrder !== undefined;
      case OrderType.DINE_IN:
        return details.dineInOrder !== undefined;
    }
  }

  private async createOrderTypeDetails(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    type: OrderType,
    details: OrderTypeDetails,
  ): Promise<
    | { referenceId: string }
    | {
        error:
          | 'type-details-required'
          | 'table-not-found'
          | 'guest-count-exceeds-capacity';
      }
  > {
    switch (type) {
      case OrderType.DELIVERY: {
        const detail = details.deliveryOrder;
        if (
          !detail ||
          detail.deliveryFee === undefined ||
          detail.name === undefined ||
          detail.address === undefined ||
          detail.phone === undefined ||
          detail.latitude === undefined ||
          detail.longitude === undefined
        ) {
          return { error: 'type-details-required' };
        }
        const created = await transaction.deliveryOrder.create({
          data: {
            deliveryFee: detail.deliveryFee,
            name: detail.name,
            address: detail.address,
            phone: detail.phone,
            latitude: detail.latitude,
            longitude: detail.longitude,
          },
          select: { id: true },
        });
        return { referenceId: created.id };
      }
      case OrderType.TAKEAWAY: {
        const detail = details.takeawayOrder;
        if (!detail || detail.name === undefined) {
          return { error: 'type-details-required' };
        }
        const created = await transaction.takeawayOrder.create({
          data: {
            name: detail.name,
            ...(detail.phone !== undefined && { phone: detail.phone }),
            ...(detail.pickUpTime !== undefined && {
              pickUpTime: detail.pickUpTime,
            }),
          },
          select: { id: true },
        });
        return { referenceId: created.id };
      }
      case OrderType.DINE_IN: {
        const detail = details.dineInOrder;
        if (!detail?.tableId) {
          return { error: 'type-details-required' };
        }
        const guestCount = detail.guestCount ?? 1;
        const tableError = await this.validateTableCapacity(
          transaction,
          organizationId,
          detail.tableId,
          guestCount,
        );
        if (tableError) {
          return { error: tableError };
        }
        const created = await transaction.dineInOrder.create({
          data: {
            table: { connect: { id: detail.tableId } },
            ...(detail.name !== undefined && { name: detail.name }),
            guestCount,
          },
          select: { id: true },
        });
        return { referenceId: created.id };
      }
    }
  }

  private async updateOrderTypeDetails(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    type: OrderType,
    referenceId: string,
    details: OrderTypeDetails,
  ) {
    switch (type) {
      case OrderType.DELIVERY: {
        const detail = details.deliveryOrder;
        if (!detail) {
          return 'type-detail-not-found' as const;
        }
        const existing = await transaction.deliveryOrder.findUnique({
          where: { id: referenceId },
          select: { id: true },
        });
        if (!existing) {
          return 'type-detail-not-found' as const;
        }
        await transaction.deliveryOrder.update({
          where: { id: referenceId },
          data: detail,
        });
        return null;
      }
      case OrderType.TAKEAWAY: {
        const detail = details.takeawayOrder;
        if (!detail) {
          return 'type-detail-not-found' as const;
        }
        const existing = await transaction.takeawayOrder.findUnique({
          where: { id: referenceId },
          select: { id: true },
        });
        if (!existing) {
          return 'type-detail-not-found' as const;
        }
        await transaction.takeawayOrder.update({
          where: { id: referenceId },
          data: detail,
        });
        return null;
      }
      case OrderType.DINE_IN: {
        const detail = details.dineInOrder;
        if (!detail) {
          return 'type-detail-not-found' as const;
        }
        const existing = await transaction.dineInOrder.findUnique({
          where: { id: referenceId },
          select: { tableId: true, guestCount: true },
        });
        if (!existing) {
          return 'type-detail-not-found' as const;
        }
        const tableId = detail.tableId ?? existing.tableId;
        const guestCount = detail.guestCount ?? existing.guestCount;
        const tableError = await this.validateTableCapacity(
          transaction,
          organizationId,
          tableId,
          guestCount,
        );
        if (tableError) {
          return tableError;
        }
        await transaction.dineInOrder.update({
          where: { id: referenceId },
          data: {
            ...(detail.tableId && {
              table: { connect: { id: detail.tableId } },
            }),
            ...(detail.name !== undefined && { name: detail.name }),
            ...(detail.guestCount !== undefined && {
              guestCount: detail.guestCount,
            }),
          },
        });
        return null;
      }
    }
  }

  private async validateTableCapacity(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    tableId: string,
    guestCount: number,
  ) {
    const table = await transaction.table.findFirst({
      where: { id: tableId, organizationId },
      select: { capacity: true },
    });
    if (!table) {
      return 'table-not-found' as const;
    }
    if (guestCount > table.capacity) {
      return 'guest-count-exceeds-capacity' as const;
    }
    return null;
  }

  private deleteOrderTypeDetails(
    transaction: Prisma.TransactionClient,
    type: OrderType,
    referenceId: string,
  ) {
    switch (type) {
      case OrderType.DELIVERY:
        return transaction.deliveryOrder.deleteMany({
          where: { id: referenceId },
        });
      case OrderType.TAKEAWAY:
        return transaction.takeawayOrder.deleteMany({
          where: { id: referenceId },
        });
      case OrderType.DINE_IN:
        return transaction.dineInOrder.deleteMany({
          where: { id: referenceId },
        });
    }
  }

  private async getProductUnitCosts(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    products: Array<{
      quantity: number;
      productIngredients: Array<{
        inventoryItemId: string;
        quantity: Prisma.Decimal;
      }>;
      modifiers: Array<{
        inventoryItemId: string | null;
        inventoryQuantity: Prisma.Decimal | null;
      }>;
    }>,
  ) {
    const inventoryItemIds = [
      ...new Set(
        products.flatMap((product) => [
          ...product.productIngredients.map(
            (ingredient) => ingredient.inventoryItemId,
          ),
          ...product.modifiers.flatMap((modifier) =>
            modifier.inventoryItemId ? [modifier.inventoryItemId] : [],
          ),
        ]),
      ),
    ];
    if (!inventoryItemIds.length) {
      return products.map(() => ({
        unitCost: new Prisma.Decimal(0),
        costingStatus: CostingStatus.UNKNOWN,
      }));
    }

    const inventoryItems = await transaction.inventoryItem.findMany({
      where: { organizationId, id: { in: inventoryItemIds } },
      select: { id: true },
    });
    if (inventoryItems.length !== inventoryItemIds.length) {
      throw new OrderInventoryReferenceError();
    }

    const lots = await transaction.inventoryLot.findMany({
      where: {
        inventoryItemId: { in: inventoryItemIds },
        remainingQuantity: { gt: 0 },
      },
      orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        inventoryItemId: true,
        remainingQuantity: true,
        unitCost: true,
      },
    });
    const lotsByItem = new Map<
      string,
      Array<{
        id: string;
        remainingQuantity: Prisma.Decimal;
        unitCost: Prisma.Decimal;
      }>
    >();
    for (const lot of lots) {
      const itemLots = lotsByItem.get(lot.inventoryItemId) ?? [];
      itemLots.push(lot);
      lotsByItem.set(lot.inventoryItemId, itemLots);
    }

    const remainingByLotId = new Map(
      lots.map((lot) => [
        lot.id,
        lot.remainingQuantity.greaterThan(0)
          ? lot.remainingQuantity
          : new Prisma.Decimal(0),
      ]),
    );
    return products.map((product) => {
      let totalCost = new Prisma.Decimal(0);
      const sources = [
        ...product.productIngredients,
        ...product.modifiers.flatMap((modifier) =>
          modifier.inventoryItemId && modifier.inventoryQuantity
            ? [
                {
                  inventoryItemId: modifier.inventoryItemId,
                  quantity: modifier.inventoryQuantity,
                },
              ]
            : [],
        ),
      ];
      let known = sources.length > 0;

      for (const source of sources) {
        let quantityNeeded = source.quantity.mul(product.quantity);
        let sourceCost = new Prisma.Decimal(0);
        for (const lot of lotsByItem.get(source.inventoryItemId) ?? []) {
          if (quantityNeeded.lessThanOrEqualTo(0)) {
            break;
          }
          const available = remainingByLotId.get(lot.id)!;
          if (available.lessThanOrEqualTo(0)) {
            continue;
          }
          const consumed = available.lessThan(quantityNeeded)
            ? available
            : quantityNeeded;
          sourceCost = sourceCost.plus(lot.unitCost.mul(consumed));
          remainingByLotId.set(lot.id, available.minus(consumed));
          quantityNeeded = quantityNeeded.minus(consumed);
        }
        if (quantityNeeded.greaterThan(0)) {
          known = false;
        }
        totalCost = totalCost.plus(sourceCost);
      }

      return {
        unitCost: roundCost(totalCost.div(product.quantity), 3),
        costingStatus: known ? CostingStatus.CALCULATED : CostingStatus.UNKNOWN,
      };
    });
  }

  private async prepareOrderInventoryAndCosts(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    lines: InventoryLineInput[],
  ): Promise<PreparedInventoryPlan> {
    type Source = {
      inventoryItemId: string;
      quantity: Prisma.Decimal;
      trackInventory: boolean;
      inventoryPolicy: InventoryPolicy;
    };

    const sourcesByLine = lines.map((line) => {
      const sources: Source[] = line.productIngredients.map((ingredient) => {
        if (!ingredient.quantity.greaterThan(0)) {
          throw new OrderModifierValidationError(
            'modifier-option-invalid',
            'Product ingredient quantities must be positive',
          );
        }
        return {
          inventoryItemId: ingredient.inventoryItemId,
          quantity: ingredient.quantity,
          trackInventory: line.productTrackInventory,
          inventoryPolicy: line.productInventoryPolicy,
        };
      });

      for (const modifier of line.modifiers) {
        if (!modifier.inventoryItemId) {
          if (modifier.trackInventory || modifier.inventoryQuantity) {
            throw new OrderModifierValidationError(
              'modifier-option-invalid',
              'Modifier inventory item and quantity must be configured together',
            );
          }
          continue;
        }
        if (
          !modifier.inventoryQuantity ||
          !modifier.inventoryQuantity.greaterThan(0)
        ) {
          throw new OrderModifierValidationError(
            'modifier-option-invalid',
            'Modifier inventory quantity must be positive when an inventory item is configured',
          );
        }
        sources.push({
          inventoryItemId: modifier.inventoryItemId,
          quantity: modifier.inventoryQuantity,
          trackInventory: modifier.trackInventory,
          inventoryPolicy: modifier.inventoryPolicy,
        });
      }

      return sources;
    });

    const inventoryItemIds = [
      ...new Set(
        sourcesByLine.flatMap((sources) =>
          sources.map((s) => s.inventoryItemId),
        ),
      ),
    ];
    if (!inventoryItemIds.length) {
      return {
        costs: lines.map(() => ({
          unitCost: new Prisma.Decimal(0),
          costingStatus: CostingStatus.UNKNOWN,
        })),
        lotUpdates: [],
        consumptions: [],
      };
    }

    await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM inventory_items
      WHERE organization_id = CAST(${organizationId} AS uuid)
        AND id IN (${Prisma.join(inventoryItemIds.map((id) => Prisma.sql`CAST(${id} AS uuid)`))})
      ORDER BY id
      FOR UPDATE
    `);
    const inventoryItems = await transaction.inventoryItem.findMany({
      where: { organizationId, id: { in: inventoryItemIds } },
      select: { id: true, name: true },
    });
    if (inventoryItems.length !== inventoryItemIds.length) {
      throw new OrderInventoryReferenceError();
    }
    const itemNameById = new Map(
      inventoryItems.map((item) => [item.id, item.name]),
    );

    const lots = await transaction.inventoryLot.findMany({
      where: { inventoryItemId: { in: inventoryItemIds } },
      orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        inventoryItemId: true,
        quantity: true,
        remainingQuantity: true,
        unitCost: true,
        purchaseItemId: true,
        preparationOutputId: true,
      },
    });
    const lotsByItem = new Map<
      string,
      Array<{
        id: string;
        inventoryItemId: string;
        quantity: Prisma.Decimal;
        remainingQuantity: Prisma.Decimal;
        unitCost: Prisma.Decimal;
        purchaseItemId: string | null;
        preparationOutputId: string | null;
      }>
    >();
    for (const lot of lots) {
      const itemLots = lotsByItem.get(lot.inventoryItemId) ?? [];
      itemLots.push(lot);
      lotsByItem.set(lot.inventoryItemId, itemLots);
    }

    const remainingByLotId = new Map(
      lots.map((lot) => [lot.id, lot.remainingQuantity]),
    );
    const strictRequiredByItem = new Map<string, Prisma.Decimal>();
    for (const [lineIndex, sources] of sourcesByLine.entries()) {
      for (const source of sources) {
        if (
          !source.trackInventory ||
          source.inventoryPolicy !== InventoryPolicy.STRICT
        ) {
          continue;
        }
        const quantity = source.quantity.mul(lines[lineIndex].quantity);
        strictRequiredByItem.set(
          source.inventoryItemId,
          (
            strictRequiredByItem.get(source.inventoryItemId) ??
            new Prisma.Decimal(0)
          ).plus(quantity),
        );
      }
    }

    for (const [inventoryItemId, strictRequired] of strictRequiredByItem) {
      const available = (lotsByItem.get(inventoryItemId) ?? []).reduce(
        (sum, lot) => sum.plus(lot.remainingQuantity),
        new Prisma.Decimal(0),
      );
      if (available.lessThan(strictRequired)) {
        throw new InsufficientOrderInventoryError(
          itemNameById.get(inventoryItemId) ?? inventoryItemId,
        );
      }
    }

    const lineCosts = lines.map(() => new Prisma.Decimal(0));
    const lineCostsKnown = sourcesByLine.map((sources) => sources.length > 0);
    const costOnlyRemainingByLotId = new Map(
      lots.map((lot) => [
        lot.id,
        lot.remainingQuantity.greaterThan(0)
          ? lot.remainingQuantity
          : new Prisma.Decimal(0),
      ]),
    );
    const consumptions: PlannedInventoryConsumption[] = [];

    const trackedSources = sourcesByLine.flatMap((sources, lineIndex) =>
      sources
        .filter((source) => source.trackInventory)
        .map((source) => ({ source, lineIndex })),
    );
    trackedSources.sort(
      (left, right) =>
        Number(right.source.inventoryPolicy === InventoryPolicy.STRICT) -
          Number(left.source.inventoryPolicy === InventoryPolicy.STRICT) ||
        left.lineIndex - right.lineIndex,
    );

    for (const { lineIndex, source } of trackedSources) {
      const itemLots = lotsByItem.get(source.inventoryItemId) ?? [];
      let quantityNeeded = source.quantity.mul(lines[lineIndex].quantity);
      let sourceCost = new Prisma.Decimal(0);
      for (const lot of itemLots) {
        if (quantityNeeded.lessThanOrEqualTo(0)) {
          break;
        }
        const available = remainingByLotId.get(lot.id)!;
        if (available.lessThanOrEqualTo(0)) {
          continue;
        }
        const consumed = available.lessThan(quantityNeeded)
          ? available
          : quantityNeeded;
        consumptions.push({
          inventoryItemId: source.inventoryItemId,
          inventoryLotId: lot.id,
          quantity: consumed,
          unitCost: lot.unitCost,
        });
        sourceCost = sourceCost.plus(lot.unitCost.mul(consumed));
        remainingByLotId.set(lot.id, available.minus(consumed));
        quantityNeeded = quantityNeeded.minus(consumed);
      }
      if (quantityNeeded.greaterThan(0)) {
        if (source.inventoryPolicy === InventoryPolicy.STRICT) {
          throw new InsufficientOrderInventoryError(
            itemNameById.get(source.inventoryItemId) ?? source.inventoryItemId,
          );
        }
        const fallbackLot = itemLots[0];
        if (fallbackLot) {
          if (
            fallbackLot.quantity.isZero() &&
            fallbackLot.purchaseItemId === null &&
            fallbackLot.preparationOutputId === null
          ) {
            lineCostsKnown[lineIndex] = false;
          }
          remainingByLotId.set(
            fallbackLot.id,
            remainingByLotId.get(fallbackLot.id)!.minus(quantityNeeded),
          );
          sourceCost = sourceCost.plus(
            fallbackLot.unitCost.mul(quantityNeeded),
          );
          consumptions.push({
            inventoryItemId: source.inventoryItemId,
            inventoryLotId: fallbackLot.id,
            quantity: quantityNeeded,
            unitCost: fallbackLot.unitCost,
          });
        } else {
          lineCostsKnown[lineIndex] = false;
          consumptions.push({
            inventoryItemId: source.inventoryItemId,
            inventoryLotId: null,
            quantity: quantityNeeded,
            unitCost: new Prisma.Decimal(0),
          });
        }
      }
      lineCosts[lineIndex] = lineCosts[lineIndex].plus(sourceCost);
    }

    for (const [lineIndex, sources] of sourcesByLine.entries()) {
      for (const source of sources) {
        if (source.trackInventory) {
          continue;
        }
        const itemLots = lotsByItem.get(source.inventoryItemId) ?? [];
        let quantityNeeded = source.quantity.mul(lines[lineIndex].quantity);
        let sourceCost = new Prisma.Decimal(0);
        for (const lot of itemLots) {
          if (quantityNeeded.lessThanOrEqualTo(0)) {
            break;
          }
          const available = costOnlyRemainingByLotId.get(lot.id)!;
          if (available.lessThanOrEqualTo(0)) {
            continue;
          }
          const consumed = available.lessThan(quantityNeeded)
            ? available
            : quantityNeeded;
          sourceCost = sourceCost.plus(lot.unitCost.mul(consumed));
          costOnlyRemainingByLotId.set(lot.id, available.minus(consumed));
          quantityNeeded = quantityNeeded.minus(consumed);
        }
        if (quantityNeeded.greaterThan(0)) {
          lineCostsKnown[lineIndex] = false;
        }
        lineCosts[lineIndex] = lineCosts[lineIndex].plus(sourceCost);
      }
    }

    const costs = lines.map((line, index) => ({
      unitCost: roundCost(lineCosts[index].div(line.quantity), 3),
      costingStatus: lineCostsKnown[index]
        ? CostingStatus.CALCULATED
        : CostingStatus.UNKNOWN,
    }));
    const lotUpdates = lots.flatMap((lot) => {
      const remainingQuantity = remainingByLotId.get(lot.id)!;
      return remainingQuantity.equals(lot.remainingQuantity)
        ? []
        : [
            {
              id: lot.id,
              initialQuantity: lot.remainingQuantity,
              remainingQuantity,
              inventoryItemId: lot.inventoryItemId,
            },
          ];
    });

    const groupedConsumptions = new Map<string, PlannedInventoryConsumption>();
    for (const consumption of consumptions) {
      const key = `${consumption.inventoryItemId}:${consumption.inventoryLotId ?? 'new-shortage-lot'}`;
      const current = groupedConsumptions.get(key);
      if (current) {
        current.quantity = current.quantity.plus(consumption.quantity);
      } else {
        groupedConsumptions.set(key, { ...consumption });
      }
    }

    return {
      costs,
      lotUpdates,
      consumptions: [...groupedConsumptions.values()],
    };
  }

  private async commitOrderInventory(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    orderId: string,
    plan: PreparedInventoryPlan,
  ) {
    for (const lot of plan.lotUpdates) {
      const result = await transaction.inventoryLot.updateMany({
        where: { id: lot.id, remainingQuantity: lot.initialQuantity },
        data: { remainingQuantity: lot.remainingQuantity },
      });
      if (result.count !== 1) {
        throw new InsufficientOrderInventoryError(lot.inventoryItemId);
      }
    }

    const shortageByItem = new Map<string, Prisma.Decimal>();
    for (const consumption of plan.consumptions) {
      if (!consumption.inventoryLotId) {
        shortageByItem.set(
          consumption.inventoryItemId,
          (
            shortageByItem.get(consumption.inventoryItemId) ??
            new Prisma.Decimal(0)
          ).plus(consumption.quantity),
        );
      }
    }

    const syntheticLotByItem = new Map<string, string>();
    for (const [inventoryItemId, quantity] of shortageByItem) {
      const lot = await transaction.inventoryLot.create({
        data: {
          inventoryItemId,
          quantity: new Prisma.Decimal(0),
          remainingQuantity: quantity.negated(),
          unitCost: new Prisma.Decimal(0),
          totalCost: new Prisma.Decimal(0),
          receivedAt: new Date(),
        },
        select: { id: true },
      });
      syntheticLotByItem.set(inventoryItemId, lot.id);
    }

    if (plan.consumptions.length) {
      await transaction.inventoryTransaction.createMany({
        data: plan.consumptions.map((consumption) => ({
          organizationId,
          inventoryItemId: consumption.inventoryItemId,
          inventoryLotId:
            consumption.inventoryLotId ??
            syntheticLotByItem.get(consumption.inventoryItemId)!,
          type: InventoryTransactionType.SALE,
          quantity: consumption.quantity,
          unitCost: consumption.unitCost,
          totalCost: roundCost(
            consumption.unitCost.mul(consumption.quantity),
            2,
          ),
          referenceId: orderId,
        })),
      });
    }
  }

  private async applyOrderInventory(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    orderId: string,
    refreshCosts = true,
  ) {
    const items = await transaction.orderItem.findMany({
      where: { orderId },
      select: {
        id: true,
        quantity: true,
        product: {
          select: {
            stockManagement: true,
            inventoryPolicy: true,
            productIngredients: {
              select: { inventoryItemId: true, quantity: true },
            },
          },
        },
        modifiers: {
          select: {
            inventoryItemId: true,
            inventoryQuantity: true,
            trackInventory: true,
            inventoryPolicy: true,
          },
        },
      },
    });
    const plan = await this.prepareOrderInventoryAndCosts(
      transaction,
      organizationId,
      items.map((item) => ({
        quantity: item.quantity,
        productTrackInventory:
          item.product.stockManagement === ProductStockManagement.INVENTORY,
        productInventoryPolicy: item.product.inventoryPolicy,
        productIngredients: item.product.productIngredients,
        modifiers: item.modifiers,
      })),
    );
    if (refreshCosts) {
      for (const [index, item] of items.entries()) {
        await transaction.orderItem.update({
          where: { id: item.id },
          data: {
            unitCost: plan.costs[index].unitCost,
            costingStatus: plan.costs[index].costingStatus,
          },
        });
      }
    }
    await this.commitOrderInventory(transaction, organizationId, orderId, plan);
  }

  private async lockProducts(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    ids: string[],
  ) {
    const productIds = [...new Set(ids)].sort();
    if (!productIds.length) {
      return;
    }

    await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      SELECT id
      FROM products
      WHERE organization_id = CAST(${organizationId} AS uuid)
        AND id IN (${Prisma.join(productIds.map((id) => Prisma.sql`CAST(${id} AS uuid)`))})
      ORDER BY id
      FOR UPDATE
    `);
  }

  private async applyOrderManualStock(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    orderId: string,
  ) {
    const items = await transaction.orderItem.findMany({
      where: { orderId },
      select: {
        id: true,
        productId: true,
        quantity: true,
        manualStockDeducted: true,
        product: {
          select: {
            name: true,
            stock: true,
            stockManagement: true,
          },
        },
      },
    });
    const demandByProductId = new Map<
      string,
      { quantity: number; name: string }
    >();
    for (const item of items) {
      if (item.product.stockManagement !== ProductStockManagement.MANUAL) {
        continue;
      }
      if (item.product.stock === null) {
        throw new InvalidManualProductStockError(item.product.name);
      }
      const current = demandByProductId.get(item.productId);
      demandByProductId.set(item.productId, {
        quantity: (current?.quantity ?? 0) + item.quantity,
        name: item.product.name,
      });
    }

    for (const [productId, demand] of [...demandByProductId].sort(
      ([left], [right]) => left.localeCompare(right),
    )) {
      const result = await transaction.product.updateMany({
        where: {
          id: productId,
          organizationId,
          stockManagement: ProductStockManagement.MANUAL,
          stock: { gte: demand.quantity },
        },
        data: { stock: { decrement: demand.quantity } },
      });
      if (result.count !== 1) {
        throw new InsufficientManualProductStockError(demand.name);
      }
    }

    for (const item of items) {
      const manualStockDeducted =
        item.product.stockManagement === ProductStockManagement.MANUAL;
      if (item.manualStockDeducted !== manualStockDeducted) {
        await transaction.orderItem.update({
          where: { id: item.id },
          data: { manualStockDeducted },
        });
      }
    }
  }

  private async restoreOrderManualStock(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    items: Array<{
      productId: string;
      quantity: number;
      manualStockDeducted: boolean;
    }>,
  ) {
    const quantityByProductId = new Map<string, number>();
    for (const item of items) {
      if (item.manualStockDeducted) {
        quantityByProductId.set(
          item.productId,
          (quantityByProductId.get(item.productId) ?? 0) + item.quantity,
        );
      }
    }

    for (const [productId, quantity] of [...quantityByProductId].sort(
      ([left], [right]) => left.localeCompare(right),
    )) {
      const result = await transaction.product.updateMany({
        where: {
          id: productId,
          organizationId,
          stock: { not: null },
        },
        data: { stock: { increment: quantity } },
      });
      if (result.count !== 1) {
        throw new InvalidManualProductStockError(productId);
      }
    }
  }

  private async restoreOrderInventory(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    orderId: string,
  ) {
    const transactions = await transaction.inventoryTransaction.findMany({
      where: {
        organizationId,
        referenceId: orderId,
        type: {
          in: [InventoryTransactionType.SALE, InventoryTransactionType.RETURN],
        },
      },
      select: {
        inventoryLotId: true,
        inventoryItemId: true,
        quantity: true,
        unitCost: true,
        type: true,
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const inventoryItemIds = [
      ...new Set(transactions.map((record) => record.inventoryItemId)),
    ].sort();
    if (inventoryItemIds.length) {
      await transaction.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT id
        FROM inventory_items
        WHERE organization_id = CAST(${organizationId} AS uuid)
          AND id IN (${Prisma.join(inventoryItemIds.map((id) => Prisma.sql`CAST(${id} AS uuid)`))})
        ORDER BY id
        FOR UPDATE
      `);
      const inventoryItems = await transaction.inventoryItem.findMany({
        where: { organizationId, id: { in: inventoryItemIds } },
        select: { id: true },
      });
      if (inventoryItems.length !== inventoryItemIds.length) {
        throw new OrderInventoryReferenceError();
      }
    }

    const netByLot = new Map<
      string,
      {
        inventoryItemId: string;
        quantity: Prisma.Decimal;
        unitCost: Prisma.Decimal;
      }
    >();
    for (const record of transactions) {
      const current = netByLot.get(record.inventoryLotId) ?? {
        inventoryItemId: record.inventoryItemId,
        quantity: new Prisma.Decimal(0),
        unitCost: record.unitCost,
      };
      const delta =
        record.type === InventoryTransactionType.SALE
          ? record.quantity
          : record.quantity.negated();
      current.quantity = current.quantity.plus(delta);
      current.unitCost = record.unitCost;
      netByLot.set(record.inventoryLotId, current);
    }

    for (const [inventoryLotId, record] of netByLot) {
      if (!record.quantity.greaterThan(0)) {
        continue;
      }
      await transaction.inventoryLot.update({
        where: { id: inventoryLotId },
        data: { remainingQuantity: { increment: record.quantity } },
      });
      await transaction.inventoryTransaction.create({
        data: {
          organizationId,
          inventoryItemId: record.inventoryItemId,
          inventoryLotId,
          type: InventoryTransactionType.RETURN,
          quantity: record.quantity,
          unitCost: record.unitCost,
          totalCost: roundCost(record.unitCost.mul(record.quantity), 2),
          referenceId: orderId,
        },
      });
    }
  }
}
