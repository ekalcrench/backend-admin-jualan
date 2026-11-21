/* eslint-disable @typescript-eslint/no-empty-object-type */
import { Injectable } from '@nestjs/common';
import {
  CashTransactionType,
  InventoryTransactionType,
  OrderStatus,
  OrderType,
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

  private async getTotalUnitCost(where: Prisma.OrderWhereInput) {
    const items = await this.prisma.orderItem.findMany({
      where: { order: { is: { ...where, status: OrderStatus.PAID } } },
      select: { quantity: true, unitCost: true },
    });

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
    const result = await this.prisma.$transaction(async (transaction) => {
      const result = await transaction.order.updateMany({
        where: { id, organizationId, status: OrderStatus.UNPAID },
        data: { status: OrderStatus.PAID },
      });

      if (result.count === 1) {
        await this.applyOrderInventory(transaction, organizationId, id);
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
    });
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
          const resolvedItems =
            await this.productModifierOrdering.resolveOrderItems(
              transaction,
              organizationId,
              orderItems.map((item) => ({
                productId: item.productId,
                modifierOptionIds: item.modifierOptionIds ?? [],
              })),
            );
          const unitCostByProductId = await this.getProductUnitCosts(
            transaction,
            resolvedItems.map((item) => ({
              id: item.productId,
              productIngredients: item.productIngredients,
            })),
          );

          const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
          let totalAmount = new Prisma.Decimal(0);
          let totalQuantity = 0;

          for (const [index, resolved] of resolvedItems.entries()) {
            const quantity = orderItems[index].quantity;
            const unitCost = unitCostByProductId.get(resolved.productId);
            if (unitCost === undefined) {
              throw new OrderModifierValidationError(
                'product-not-found',
                'One or more products were not found in this organization',
              );
            }

            const modifierSnapshots = resolved.modifierSnapshots ?? [];
            items.push({
              product: { connect: { id: resolved.productId } },
              quantity,
              unitPrice: resolved.sellingPrice,
              unitCost,
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
              organization: { connect: { id: organizationId } },
              cashier: { connect: { id: cashierId } },
              ...(customerId && {
                customer: { connect: { id: customerId } },
              }),
              items: { create: items },
            },
            include: responseInclude,
          });
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
            select: { id: true, status: true, type: true, referenceId: true },
          });
          if (!order) {
            return 'not-found' as const;
          }
          if (order.status === OrderStatus.PAID) {
            return 'paid' as const;
          }

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
          const unitCostByProductId = await this.getProductUnitCosts(
            transaction,
            resolvedItems.map((item) => ({
              id: item.productId,
              productIngredients: item.productIngredients,
            })),
          );

          const pricedChanges: Array<{
            item: OrderItemChange;
            quantity: number;
            resolved: ResolvedOrderModifierItem;
            unitCost: Prisma.Decimal;
          }> = [];
          for (const [index, item] of itemChanges.entries()) {
            const meta = changeMeta.get(item)!;
            const resolved = resolvedItems[index];
            const unitCost = unitCostByProductId.get(resolved.productId);
            if (unitCost === undefined) {
              throw new OrderModifierValidationError(
                'product-not-found',
                'One or more products were not found in this organization',
              );
            }

            pricedChanges.push({
              item,
              quantity: meta.quantity,
              resolved,
              unitCost,
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

          for (const { item, quantity, resolved, unitCost } of pricedChanges) {
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
    products: Array<{
      id: string;
      productIngredients: Array<{
        inventoryItemId: string;
        quantity: Prisma.Decimal;
      }>;
    }>,
  ) {
    const inventoryItemIds = [
      ...new Set(
        products.flatMap((product) =>
          product.productIngredients.map(
            (ingredient) => ingredient.inventoryItemId,
          ),
        ),
      ),
    ];
    const lots = inventoryItemIds.length
      ? await transaction.inventoryLot.findMany({
          where: {
            inventoryItemId: { in: inventoryItemIds },
            remainingQuantity: { gt: 0 },
          },
          orderBy: [{ receivedAt: 'asc' }, { id: 'asc' }],
          select: {
            inventoryItemId: true,
            remainingQuantity: true,
            unitCost: true,
          },
        })
      : [];

    const lotsByInventoryItemId = new Map<
      string,
      Array<{ remainingQuantity: Prisma.Decimal; unitCost: Prisma.Decimal }>
    >();
    for (const lot of lots) {
      const itemLots = lotsByInventoryItemId.get(lot.inventoryItemId) ?? [];
      itemLots.push(lot);
      lotsByInventoryItemId.set(lot.inventoryItemId, itemLots);
    }

    const unitCostByProductId = new Map<string, Prisma.Decimal>();
    for (const product of products) {
      let productUnitCost = new Prisma.Decimal(0);
      for (const ingredient of product.productIngredients) {
        let quantityNeeded = ingredient.quantity;
        let ingredientCost = new Prisma.Decimal(0);
        let quantityCosted = new Prisma.Decimal(0);

        for (const lot of lotsByInventoryItemId.get(
          ingredient.inventoryItemId,
        ) ?? []) {
          if (quantityNeeded.lessThanOrEqualTo(0)) {
            break;
          }
          const consumed = lot.remainingQuantity.lessThan(quantityNeeded)
            ? lot.remainingQuantity
            : quantityNeeded;
          ingredientCost = ingredientCost.plus(lot.unitCost.mul(consumed));
          quantityCosted = quantityCosted.plus(consumed);
          quantityNeeded = quantityNeeded.minus(consumed);
        }

        if (quantityCosted.greaterThan(0)) {
          productUnitCost = productUnitCost.plus(
            roundCost(
              ingredientCost.div(quantityCosted).mul(ingredient.quantity),
              3,
            ),
          );
        }
      }
      unitCostByProductId.set(product.id, roundCost(productUnitCost, 3));
    }

    return unitCostByProductId;
  }

  private async applyOrderInventory(
    transaction: Prisma.TransactionClient,
    organizationId: string,
    orderId: string,
  ) {
    const items = await transaction.orderItem.findMany({
      where: { orderId },
      select: {
        quantity: true,
        product: {
          select: {
            productIngredients: {
              select: {
                inventoryItemId: true,
                quantity: true,
              },
            },
          },
        },
        modifiers: {
          select: {
            inventoryItemId: true,
            inventoryQuantity: true,
          },
        },
      },
    });

    // Aggregate both recipe ingredients and modifier inventory snapshots by
    // inventory item so an item consumed by several modifiers (or by a modifier
    // and the recipe) is allocated exactly once through the same FIFO walk.
    const requiredQuantityByInventoryItemId = new Map<
      string,
      Prisma.Decimal
    >();
    const addRequiredQuantity = (
      inventoryItemId: string,
      quantity: Prisma.Decimal,
    ) => {
      const current =
        requiredQuantityByInventoryItemId.get(inventoryItemId) ??
        new Prisma.Decimal(0);
      requiredQuantityByInventoryItemId.set(
        inventoryItemId,
        current.plus(quantity),
      );
    };

    for (const item of items) {
      for (const ingredient of item.product.productIngredients) {
        addRequiredQuantity(
          ingredient.inventoryItemId,
          ingredient.quantity.mul(item.quantity),
        );
      }
      for (const modifier of item.modifiers) {
        if (
          !modifier.inventoryItemId ||
          !modifier.inventoryQuantity ||
          modifier.inventoryQuantity.lessThanOrEqualTo(0)
        ) {
          continue;
        }
        addRequiredQuantity(
          modifier.inventoryItemId,
          modifier.inventoryQuantity.mul(item.quantity),
        );
      }
    }

    const inventoryItemIds = [...requiredQuantityByInventoryItemId.keys()];
    if (!inventoryItemIds.length) {
      return;
    }

    // Organization scoping is enforced again here even though modifier master
    // data is validated when configured. This keeps a stale or tampered
    // snapshot from consuming another tenant's stock.
    const inventoryItems = await transaction.inventoryItem.findMany({
      where: { organizationId, id: { in: inventoryItemIds } },
      select: { id: true, name: true },
    });
    const inventoryItemNameById = new Map(
      inventoryItems.map((inventoryItem) => [
        inventoryItem.id,
        inventoryItem.name,
      ]),
    );
    if (
      inventoryItemIds.some(
        (inventoryItemId) => !inventoryItemNameById.has(inventoryItemId),
      )
    ) {
      throw new OrderInventoryReferenceError();
    }

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
    const consumptions: Array<{
      inventoryItemId: string;
      inventoryLotId: string;
      quantity: Prisma.Decimal;
      unitCost: Prisma.Decimal;
      totalCost: Prisma.Decimal;
    }> = [];

    for (const [inventoryItemId, requiredQuantity] of
      requiredQuantityByInventoryItemId) {
      if (requiredQuantity.lessThanOrEqualTo(0)) {
        continue;
      }

      let quantityNeeded = requiredQuantity;
      const itemLots = lots.filter(
        (lot) => lot.inventoryItemId === inventoryItemId,
      );

      for (const lot of itemLots) {
        const available = remainingByLotId.get(lot.id)!;
        if (available.lessThanOrEqualTo(0)) {
          continue;
        }
        const consumed = available.lessThan(quantityNeeded)
          ? available
          : quantityNeeded;
        consumptions.push({
          inventoryItemId,
          inventoryLotId: lot.id,
          quantity: consumed,
          unitCost: lot.unitCost,
          totalCost: roundCost(lot.unitCost.mul(consumed), 2),
        });
        remainingByLotId.set(lot.id, available.minus(consumed));
        quantityNeeded = quantityNeeded.minus(consumed);
        if (quantityNeeded.equals(0)) {
          break;
        }
      }

      if (!quantityNeeded.equals(0)) {
        throw new InsufficientOrderInventoryError(
          inventoryItemNameById.get(inventoryItemId)!,
        );
      }
    }

    for (const [inventoryLotId, remainingQuantity] of remainingByLotId) {
      const lot = lots.find((item) => item.id === inventoryLotId)!;
      const quantityToConsume = lot.remainingQuantity.minus(remainingQuantity);
      if (quantityToConsume.greaterThan(0)) {
        const result = await transaction.inventoryLot.updateMany({
          where: {
            id: inventoryLotId,
            remainingQuantity: { gte: quantityToConsume },
          },
          data: { remainingQuantity: { decrement: quantityToConsume } },
        });
        if (result.count !== 1) {
          throw new InsufficientOrderInventoryError(
            inventoryItemNameById.get(lot.inventoryItemId) ??
              lot.inventoryItemId,
          );
        }
      }
    }

    if (consumptions.length) {
      await transaction.inventoryTransaction.createMany({
        data: consumptions.map((consumption) => ({
          organizationId,
          inventoryItemId: consumption.inventoryItemId,
          inventoryLotId: consumption.inventoryLotId,
          type: InventoryTransactionType.SALE,
          quantity: consumption.quantity,
          unitCost: consumption.unitCost,
          totalCost: consumption.totalCost,
          referenceId: orderId,
        })),
      });
    }
  }
}
