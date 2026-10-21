import { Injectable } from '@nestjs/common';
import {
  InventoryTransactionType,
  OrderStatus,
  Prisma,
} from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';
import { OrderItemChange } from './types/order-item-change.type.js';
import { responseInclude } from './constants/response-include.constants.js';
import { roundCost } from '../common/constants/round-cost.constants.js';

export class InsufficientOrderInventoryError extends Error {
  constructor(inventoryItemName: string) {
    super(`Stok untuk "${inventoryItemName}" tidak mencukupi`);
    this.name = 'InsufficientOrderInventoryError';
  }
}

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, organizationId } = data;
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

    return { items, total };
  }

  findById(id: string, organizationId: string) {
    return this.prisma.order.findFirst({
      where: { id, organizationId },
      include: responseInclude,
    });
  }

  markPaid(id: string, organizationId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.order.updateMany({
        where: { id, organizationId, status: OrderStatus.UNPAID },
        data: { status: OrderStatus.PAID },
      });

      if (result.count === 1) {
        await this.applyOrderInventory(transaction, organizationId, id);
        return transaction.order.findFirstOrThrow({
          where: { id, organizationId },
          include: responseInclude,
        });
      }

      const order = await transaction.order.findFirst({
        where: { id, organizationId },
        select: { id: true },
      });
      return order ? ('already-paid' as const) : ('not-found' as const);
    });
  }

  findProductsByIds(organizationId: string, ids: string[]) {
    return this.prisma.product.findMany({
      where: { organizationId, id: { in: ids } },
      select: { id: true, sellingPrice: true },
    });
  }

  create(
    organizationId: string,
    orderNumber: string,
    orderItems: Array<{
      productId: string;
      quantity: number;
    }>,
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        const productIds = [
          ...new Set(orderItems.map((item) => item.productId)),
        ];
        const products = await transaction.product.findMany({
          where: { organizationId, id: { in: productIds } },
          select: { id: true, sellingPrice: true },
        });
        if (products.length !== productIds.length) {
          return 'product-not-found' as const;
        }

        const sellingPriceByProductId = new Map(
          products.map((product) => [product.id, product.sellingPrice]),
        );
        const items: Prisma.OrderItemCreateWithoutOrderInput[] = [];
        for (const { productId, quantity } of orderItems) {
          const unitPrice = sellingPriceByProductId.get(productId);
          if (unitPrice === undefined) {
            return 'product-not-found' as const;
          }
          items.push({
            product: { connect: { id: productId } },
            quantity,
            unitPrice,
          });
        }

        const totalAmount = items.reduce(
          (total, item) =>
            total.plus(
              // eslint-disable-next-line @typescript-eslint/no-base-to-string
              new Prisma.Decimal(String(item.unitPrice)).mul(item.quantity),
            ),
          new Prisma.Decimal(0),
        );

        const order = await transaction.order.create({
          data: {
            orderNumber,
            totalAmount,
            status: OrderStatus.UNPAID,
            organization: { connect: { id: organizationId } },
            items: { create: items },
          },
          include: responseInclude,
        });
        return order;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  update(
    id: string,
    organizationId: string,
    data: Prisma.OrderUpdateManyMutationInput,
    itemChanges: OrderItemChange[] = [],
    deletedOrderItemIds: string[] = [],
  ) {
    return this.prisma.$transaction(
      async (transaction) => {
        const order = await transaction.order.findFirst({
          where: { id, organizationId },
          select: { id: true, status: true },
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

        let existingItems: Array<{ id: string; productId: string }> = [];
        if (updateIds.length) {
          existingItems = await transaction.orderItem.findMany({
            where: { orderId: id, id: { in: updateIds } },
            select: { id: true, productId: true },
          });
          if (existingItems.length !== updateIds.length) {
            return 'related-record-not-found' as const;
          }
        }

        const existingProductIdByItemId = new Map(
          existingItems.map((item) => [item.id, item.productId]),
        );
        const productIdByChange = new Map(
          itemChanges.map((item) => [
            item,
            item.productId ??
              (item.id ? existingProductIdByItemId.get(item.id) : undefined),
          ]),
        );
        const targetProductIds = [
          ...new Set(
            [...productIdByChange.values()].filter(
              (productId): productId is string => productId !== undefined,
            ),
          ),
        ];
        if ([...productIdByChange.values()].some((productId) => !productId)) {
          return 'related-record-not-found' as const;
        }

        const products = await transaction.product.findMany({
          where: { organizationId, id: { in: targetProductIds } },
          select: { id: true, sellingPrice: true },
        });
        if (products.length !== targetProductIds.length) {
          return 'product-not-found' as const;
        }
        const sellingPriceByProductId = new Map(
          products.map((product) => [product.id, product.sellingPrice]),
        );
        const pricedChanges: Array<{
          item: OrderItemChange;
          unitPrice: Prisma.Decimal;
        }> = [];
        for (const item of itemChanges) {
          const productId = productIdByChange.get(item);
          if (!productId) {
            return 'related-record-not-found' as const;
          }
          const unitPrice = sellingPriceByProductId.get(productId);
          if (unitPrice === undefined) {
            return 'product-not-found' as const;
          }
          pricedChanges.push({ item, unitPrice });
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

        const orderUpdate = await transaction.order.updateMany({
          where: { id, organizationId, status: OrderStatus.UNPAID },
          data: { ...data, status: OrderStatus.UNPAID },
        });
        if (orderUpdate.count === 0) {
          const currentOrder = await transaction.order.findFirst({
            where: { id, organizationId },
            select: { id: true },
          });
          return currentOrder ? ('paid' as const) : ('not-found' as const);
        }

        if (deletedOrderItemIds.length) {
          await transaction.orderItem.deleteMany({
            where: { orderId: id, id: { in: deletedOrderItemIds } },
          });
        }

        for (const { item, unitPrice } of pricedChanges) {
          if (item.id) {
            await transaction.orderItem.update({
              where: { id: item.id },
              data: { ...item.itemData, unitPrice },
            });
          } else if (item.createData) {
            await transaction.orderItem.create({
              data: {
                ...item.createData,
                unitPrice,
                order: { connect: { id } },
              },
            });
          }
        }

        const currentItems = await transaction.orderItem.findMany({
          where: { orderId: id },
          select: { quantity: true, unitPrice: true },
        });
        const totalAmount = currentItems.reduce(
          (total, item) => total.plus(item.unitPrice.mul(item.quantity)),
          new Prisma.Decimal(0),
        );

        await transaction.order.update({
          where: { id },
          data: { totalAmount },
        });

        return transaction.order.findFirstOrThrow({
          where: { id, organizationId },
          include: responseInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  delete(id: string, organizationId: string) {
    return this.prisma.$transaction(
      async (transaction) => {
        const order = await transaction.order.findFirst({
          where: { id, organizationId },
          select: { id: true, status: true },
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
        await transaction.order.delete({
          where: { id, organizationId, status: OrderStatus.UNPAID },
        });
        return 'deleted' as const;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
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
                inventoryItem: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    const inventoryItemNameById = new Map<string, string>();
    for (const item of items) {
      for (const ingredient of item.product.productIngredients) {
        inventoryItemNameById.set(
          ingredient.inventoryItemId,
          ingredient.inventoryItem.name,
        );
      }
    }
    const inventoryItemIds = [...inventoryItemNameById.keys()];
    if (!inventoryItemIds.length) {
      return;
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

    for (const item of items) {
      for (const ingredient of item.product.productIngredients) {
        let quantityNeeded = ingredient.quantity.mul(item.quantity);
        const itemLots = lots.filter(
          (lot) => lot.inventoryItemId === ingredient.inventoryItemId,
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
            inventoryItemId: ingredient.inventoryItemId,
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
            ingredient.inventoryItem.name,
          );
        }
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
