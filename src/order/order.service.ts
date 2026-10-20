import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { UpdateOrderItemDto } from './dto/update-order-item.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import {
  InsufficientOrderInventoryError,
  OrderRepository,
} from './order.repository.js';
import { OrderItemChange } from './types/order-item-change.type.js';
import { OrganizationContext } from '../common/types/organization-context.types.js';
import { ProductByIdRecord } from './types/product-by-id-record-types.js';
import { OrderRecord } from './types/order-record.types.js';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async findByPages(dto: GetByPagesDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);
    const { items, total } = await this.orderRepository.findByPages({
      ...dto,
      organizationId,
    });

    return {
      items: items.map((order) => this.toResponse(order)),
      pagination: {
        page: dto.page,
        size: dto.size,
        total,
        totalPages: Math.ceil(total / dto.size),
      },
    };
  }

  async findById(id: string, context: OrganizationContext) {
    const order = await this.orderRepository.findById(
      id,
      this.requireOrganizationId(context),
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponse(order);
  }

  async markPaid(id: string, context: OrganizationContext) {
    const result = await this.orderRepository.markPaid(
      id,
      this.requireOrganizationId(context),
    );

    if (result === 'not-found') {
      throw new NotFoundException('Order not found');
    }
    if (result === 'already-paid') {
      throw new ConflictException('Order is already paid');
    }

    return this.toResponse(result);
  }

  async create(dto: CreateOrderDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);
    await this.ensureProductsBelongToOrganization(
      dto.orderItems.map((item) => item.productId),
      organizationId,
    );

    try {
      const order = await this.orderRepository.create(
        organizationId,
        dto.orderNumber,
        dto.orderItems,
      );
      if (order === 'product-not-found') {
        throw new NotFoundException(
          'One or more products were not found in this organization',
        );
      }
      return this.toResponse(order);
    } catch (error) {
      this.throwIfInsufficientInventory(error);
      this.throwIfDuplicateOrderNumber(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateOrderDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);
    const updatedItemIds = new Set(
      dto.orderItems
        ?.map((item) => item.id)
        .filter((itemId): itemId is string => itemId !== undefined) ?? [],
    );

    if (dto.deletedOrderItemIds?.some((itemId) => updatedItemIds.has(itemId))) {
      throw new BadRequestException(
        'An order item cannot be updated and deleted in the same request',
      );
    }

    const productIds = [
      ...new Set(
        dto.orderItems
          ?.map((item) => item.productId)
          .filter(
            (productId): productId is string => productId !== undefined,
          ) ?? [],
      ),
    ];
    const products = await this.ensureProductsBelongToOrganization(
      productIds,
      organizationId,
    );

    const productsById = new Map<string, ProductByIdRecord>(
      products.map((product) => [product.id, product]),
    );
    const itemChanges = (dto.orderItems ?? []).map((item) =>
      this.toOrderItemChange(item, productsById),
    );

    const orderData: Prisma.OrderUpdateManyMutationInput = {
      ...(dto.orderNumber !== undefined && { orderNumber: dto.orderNumber }),
    };

    try {
      const order = await this.orderRepository.update(
        id,
        organizationId,
        orderData,
        itemChanges,
        dto.deletedOrderItemIds,
      );
      if (order === 'not-found') {
        throw new NotFoundException('Order not found');
      }
      if (order === 'paid') {
        throw new ConflictException('Paid orders cannot be updated');
      }
      if (order === 'related-record-not-found') {
        throw new NotFoundException(
          'One or more order items were not found for this order',
        );
      }
      if (order === 'product-not-found') {
        throw new NotFoundException(
          'One or more products were not found in this organization',
        );
      }
      return this.toResponse(order);
    } catch (error) {
      this.throwIfInsufficientInventory(error);
      this.throwIfDuplicateOrderNumber(error);
      throw error;
    }
  }

  async delete(id: string, context: OrganizationContext) {
    const result = await this.orderRepository.delete(
      id,
      this.requireOrganizationId(context),
    );
    if (result === 'not-found') {
      throw new NotFoundException('Order not found');
    }
    if (result === 'paid') {
      throw new ConflictException('Paid orders cannot be deleted');
    }
    return true;
  }

  private requireOrganizationId(context: OrganizationContext) {
    if (!context.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    return context.organizationId;
  }

  private async ensureProductsBelongToOrganization(
    productIds: string[],
    organizationId: string,
  ) {
    const ids = [...new Set(productIds)];
    if (!ids.length) {
      return [];
    }
    const products = await this.orderRepository.findProductsByIds(
      organizationId,
      ids,
    );
    if (products.length !== ids.length) {
      throw new NotFoundException(
        'One or more products were not found in this organization',
      );
    }
    return products;
  }

  private toOrderItemChange(
    item: UpdateOrderItemDto,
    productsById: Map<string, ProductByIdRecord>,
  ): OrderItemChange {
    if (!item.id) {
      if (item.productId === undefined || item.quantity === undefined) {
        throw new BadRequestException(
          'New order items require productId and quantity',
        );
      }
      return {
        productId: item.productId,
        itemData: {},
        createData: {
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          unitPrice: productsById.get(item.productId)!.sellingPrice,
        },
      };
    }

    return {
      id: item.id,
      ...(item.productId !== undefined && { productId: item.productId }),
      itemData: {
        ...(item.productId !== undefined && {
          product: { connect: { id: item.productId } },
        }),
        ...(item.quantity !== undefined && { quantity: item.quantity }),
      },
    };
  }

  private toResponse(order: OrderRecord) {
    return {
      id: order.id,
      organizationId: order.organizationId,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount.toNumber(),
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderItems: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        product: item.product,
      })),
    };
  }

  private throwIfDuplicateOrderNumber(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'An order with this number already exists in this organization',
      );
    }
  }

  private throwIfInsufficientInventory(error: unknown): void {
    if (error instanceof InsufficientOrderInventoryError) {
      throw new ConflictException(error.message);
    }
  }
}
