import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';
import { OrderItemChange } from './types/order-item-change.type.js';
import { responseInclude } from './constants/response-include.constants.js';

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
    return this.prisma.$transaction(async (transaction) => {
      const productIds = [...new Set(orderItems.map((item) => item.productId))];
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

      return transaction.order.create({
        data: {
          orderNumber,
          totalAmount,
          organization: { connect: { id: organizationId } },
          items: { create: items },
        },
        include: responseInclude,
      });
    });
  }

  update(
    id: string,
    organizationId: string,
    data: Prisma.OrderUpdateManyMutationInput,
    itemChanges: OrderItemChange[] = [],
    deletedOrderItemIds: string[] = [],
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findFirst({
        where: { id, organizationId },
        select: { id: true },
      });
      if (!order) {
        return 'not-found' as const;
      }

      const updateChanges = itemChanges.filter(
        (item): item is OrderItemChange & { id: string } =>
          item.id !== undefined,
      );
      console.log('>>> updateChanges : ', updateChanges);
      const updateIds = updateChanges.map((item) => item.id);
      console.log('>>> updateIds : ', updateIds);

      if (
        new Set(updateIds).size !== updateIds.length ||
        new Set(deletedOrderItemIds).size !== deletedOrderItemIds.length ||
        deletedOrderItemIds.some((itemId) => updateIds.includes(itemId))
      ) {
        return 'related-record-not-found' as const;
      }

      const consumptionAffectingUpdateIds = updateChanges
        .filter(
          (item) =>
            item.itemData.product !== undefined ||
            item.itemData.quantity !== undefined,
        )
        .map((item) => item.id);
      let existingItems: Array<{
        id: string;
        productId: string;
        _count: { inventoryConsumptions: number };
      }> = [];
      if (updateIds.length) {
        existingItems = await transaction.orderItem.findMany({
          where: { orderId: id, id: { in: updateIds } },
          select: {
            id: true,
            productId: true,
            _count: { select: { inventoryConsumptions: true } },
          },
        });
        if (existingItems.length !== updateIds.length) {
          return 'related-record-not-found' as const;
        }
        if (
          existingItems.some(
            (item) =>
              consumptionAffectingUpdateIds.includes(item.id) &&
              item._count.inventoryConsumptions > 0,
          )
        ) {
          return 'consumed' as const;
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
          select: {
            id: true,
            _count: { select: { inventoryConsumptions: true } },
          },
        });
        if (itemsToDelete.length !== deletedOrderItemIds.length) {
          return 'related-record-not-found' as const;
        }
        if (
          itemsToDelete.some((item) => item._count.inventoryConsumptions > 0)
        ) {
          return 'consumed' as const;
        }

        await transaction.orderItem.deleteMany({
          where: { orderId: id, id: { in: deletedOrderItemIds } },
        });
      }

      await transaction.order.updateMany({
        where: { id, organizationId },
        data,
      });

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
    });
  }

  delete(id: string, organizationId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findFirst({
        where: { id, organizationId },
        select: {
          id: true,
          items: {
            select: {
              id: true,
              _count: { select: { inventoryConsumptions: true } },
            },
          },
        },
      });

      if (!order) {
        return 'not-found' as const;
      }
      if (order.items.some((item) => item._count.inventoryConsumptions > 0)) {
        return 'consumed' as const;
      }

      await transaction.orderItem.deleteMany({
        where: { orderId: id },
      });
      await transaction.order.delete({
        where: { id },
      });

      return 'deleted' as const;
    });
  }
}
