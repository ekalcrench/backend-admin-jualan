import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '../../prisma/generated/prisma/client.js';
import { OrderType } from '../../prisma/generated/prisma/enums.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { UpdateOrderItemDto } from './dto/update-order-item.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import {
  InsufficientOrderInventoryError,
  OrderRepository,
} from './order.repository.js';
import { OrderItemChange } from './types/order-item-change.type.js';
import { ProductByIdRecord } from './types/product-by-id-record-types.js';
import { OrderRecord } from './types/order-record.types.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { GetOrderOverviewDto } from './dto/get-overview.dto.js';
import { UserRequestHeader } from '../common/types/user-request-header.types.js';
import { CreateDeliveryOrderDto } from './dto/create-delivery-order.dto.js';
import { UpdateDeliveryOrderDto } from './dto/update-delivery-order.dto.js';
import { CreateTakeawayOrderDto } from './dto/create-takeaway-order.dto.js';
import { CreateDineInOrderDto } from './dto/create-dine-in-order.dto.js';
import { UpdateDineInOrderDto } from './dto/update-dine-in-order.dto.js';
import { UpdateTakeawayOrderDto } from './dto/update-takeaway-order.dto.js';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async getOverview(dto: GetOrderOverviewDto, userHeader: UserRequestHeader) {
    if (
      dto.startDate &&
      dto.endDate &&
      dto.startDate.getTime() > dto.endDate.getTime()
    ) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }
    if (Boolean(dto.startDate) !== Boolean(dto.endDate)) {
      throw new BadRequestException(
        'startDate and endDate must be sent together',
      );
    }

    if (!dto.startDate || !dto.endDate) {
      const [totals, totalUnitCost] =
        await this.orderRepository.getOverviewWithoutDateRange(
          this.requireOrganizationId(userHeader),
        );
      const totalAmount = totals._sum.totalAmount ?? new Prisma.Decimal(0);
      return {
        totalAmount: totalAmount.toNumber(),
        totalQuantity: totals._sum.totalQuantity ?? 0,
        totalGrossProfit: totalAmount.minus(totalUnitCost).toNumber(),
        prevTotalAmount: 0,
        prevTotalQuantity: 0,
        prevTotalGrossProfit: 0,
      };
    }

    const [totals, previousOverviews, totalUnitCost, previousTotalUnitCost] =
      await this.orderRepository.getOverviewWithDateRange(
        this.requireOrganizationId(userHeader),
        dto.startDate,
        dto.endDate,
      );

    const totalAmount = totals._sum.totalAmount ?? new Prisma.Decimal(0);
    const previousAmount =
      previousOverviews._sum.totalAmount ?? new Prisma.Decimal(0);

    return {
      totalAmount: totalAmount.toNumber(),
      totalQuantity: totals._sum.totalQuantity ?? 0,
      totalGrossProfit: totalAmount.minus(totalUnitCost).toNumber(),
      prevTotalAmount: previousAmount.toNumber(),
      prevTotalQuantity: previousOverviews._sum.totalQuantity ?? 0,
      prevTotalGrossProfit: previousAmount
        .minus(previousTotalUnitCost)
        .toNumber(),
    };
  }

  async getOverviewItems(
    dto: GetOrderOverviewDto,
    userHeader: UserRequestHeader,
  ) {
    if (
      dto.startDate &&
      dto.endDate &&
      dto.startDate.getTime() > dto.endDate.getTime()
    ) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    const items = await this.orderRepository.getOverviewItems(
      this.requireOrganizationId(userHeader),
      dto.startDate,
      dto.endDate,
    );

    if (!items.length) {
      return {
        mostSellItemsAmount: 0,
        mostSellItemsName: '',
        mostSellItemsLatestSold: '',
        leastSellItemsAmount: 0,
        leastSellItemsName: '',
        leastSellItemsLatestSold: '',
      };
    }

    const soldByProduct = new Map<
      string,
      { name: string; amount: number; latestSold: Date }
    >();
    for (const item of items) {
      const current = soldByProduct.get(item.productId);
      const latestSold =
        current && current.latestSold > item.order.createdAt
          ? current.latestSold
          : item.order.createdAt;
      soldByProduct.set(item.productId, {
        name: item.product.name,
        amount: (current?.amount ?? 0) + item.quantity,
        latestSold,
      });
    }

    const soldItems = [...soldByProduct.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const highestAmount = Math.max(...soldItems.map((item) => item.amount));
    const lowestAmount = Math.min(...soldItems.map((item) => item.amount));
    const mostSold = soldItems.find((item) => item.amount === highestAmount)!;
    const leastSold = soldItems.find((item) => item.amount === lowestAmount)!;

    return {
      mostSellItemsAmount: mostSold.amount,
      mostSellItemsName: mostSold.name,
      mostSellItemsLatestSold: mostSold.latestSold.toISOString(),
      leastSellItemsAmount: leastSold.amount,
      leastSellItemsName: leastSold.name,
      leastSellItemsLatestSold: leastSold.latestSold.toISOString(),
    };
  }

  async findByPages(dto: GetByPagesDto, userHeader: UserRequestHeader) {
    if (
      dto.startDate &&
      dto.endDate &&
      dto.startDate.getTime() > dto.endDate.getTime()
    ) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    const organizationId = this.requireOrganizationId(userHeader);
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

  async findById(id: string, userHeader: UserRequestHeader) {
    const order = await this.orderRepository.findById(
      id,
      this.requireOrganizationId(userHeader),
    );
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.toResponse(order);
  }

  async markPaid(id: string, userHeader: UserRequestHeader) {
    try {
      const result = await this.orderRepository.markPaid(
        id,
        this.requireOrganizationId(userHeader),
      );

      if (result === 'not-found') {
        throw new NotFoundException('Order not found');
      }
      if (result === 'already-paid') {
        throw new ConflictException('Order is already paid');
      }

      return this.toResponse(result);
    } catch (error) {
      this.throwIfInsufficientInventory(error);
      throw error;
    }
  }

  async create(dto: CreateOrderDto, userHeader: UserRequestHeader) {
    const organizationId = this.requireOrganizationId(userHeader);
    this.validateOrderTypeDetails(dto, true);
    await this.ensureProductsBelongToOrganization(
      dto.orderItems.map((item) => item.productId),
      organizationId,
    );
    await this.ensureCustomerExists(dto.customerId);

    try {
      const order = await this.orderRepository.create(
        organizationId,
        dto.orderNumber,
        userHeader.sub,
        dto.customerId,
        dto.type,
        {
          deliveryOrder: dto.deliveryOrder ?? undefined,
          takeawayOrder: dto.takeawayOrder ?? undefined,
          dineInOrder: dto.dineInOrder ?? undefined,
        },
        dto.orderItems,
      );
      if (order === 'product-not-found') {
        throw new NotFoundException(
          'One or more products were not found in this organization',
        );
      }
      this.throwIfOrderTypeError(order);
      return this.toResponse(order);
    } catch (error) {
      this.throwIfInsufficientInventory(error);
      this.throwIfDuplicateOrderNumber(error);
      throw error;
    }
  }

  async update(id: string, dto: UpdateOrderDto, userHeader: UserRequestHeader) {
    const organizationId = this.requireOrganizationId(userHeader);
    const existingOrder = await this.orderRepository.findOrderType(
      id,
      organizationId,
    );
    if (!existingOrder) {
      throw new NotFoundException('Order not found');
    }
    if (existingOrder.status === OrderStatus.PAID) {
      throw new ConflictException('Paid orders cannot be updated');
    }
    const type = dto.type ?? existingOrder.type;
    this.validateOrderTypeDetails(
      { ...dto, type },
      type !== existingOrder.type,
    );
    await this.ensureCustomerExists(dto.customerId);

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

    const orderData: Prisma.OrderUncheckedUpdateManyInput = {
      ...(dto.orderNumber !== undefined && { orderNumber: dto.orderNumber }),
      ...(dto.customerId !== undefined && { customerId: dto.customerId }),
      ...(dto.type !== undefined && { type: dto.type }),
    };

    try {
      const order = await this.orderRepository.update(
        id,
        organizationId,
        orderData,
        itemChanges,
        dto.deletedOrderItemIds,
        {
          deliveryOrder: dto.deliveryOrder ?? undefined,
          takeawayOrder: dto.takeawayOrder ?? undefined,
          dineInOrder: dto.dineInOrder ?? undefined,
        },
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
      this.throwIfOrderTypeError(order);
      return this.toResponse(order);
    } catch (error) {
      this.throwIfInsufficientInventory(error);
      this.throwIfDuplicateOrderNumber(error);
      throw error;
    }
  }

  async delete(id: string, userHeader: UserRequestHeader) {
    const result = await this.orderRepository.delete(
      id,
      this.requireOrganizationId(userHeader),
    );
    if (result === 'not-found') {
      throw new NotFoundException('Order not found');
    }
    if (result === 'paid') {
      throw new ConflictException('Paid orders cannot be deleted');
    }
    return true;
  }

  private requireOrganizationId(userHeader: UserRequestHeader) {
    if (!userHeader.organizationId) {
      throw new ForbiddenException('Organization userHeader is required');
    }

    return userHeader.organizationId;
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

  private async ensureCustomerExists(customerId?: string | null) {
    if (customerId && !(await this.orderRepository.findUserById(customerId))) {
      throw new NotFoundException('Customer was not found');
    }
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

  private toResponse(order: OrderRecord): OrderResponseDto {
    return {
      id: order.id,
      organizationId: order.organizationId,
      cashierId: order.cashierId,
      cashierName: order.cashier?.name ?? null,
      customerId: order.customerId,
      type: order.type,
      referenceId: order.referenceId,
      deliveryOrder: order.deliveryOrder
        ? {
            id: order.deliveryOrder.id,
            deliveryFee: order.deliveryOrder.deliveryFee.toNumber(),
            name: order.deliveryOrder.name,
            address: order.deliveryOrder.address,
            phone: order.deliveryOrder.phone,
            latitude: order.deliveryOrder.latitude.toNumber(),
            longitude: order.deliveryOrder.longitude.toNumber(),
          }
        : null,
      takeawayOrder: order.takeawayOrder
        ? {
            id: order.takeawayOrder.id,
            name: order.takeawayOrder.name,
            phone: order.takeawayOrder.phone,
            pickUpTime: order.takeawayOrder.pickUpTime,
          }
        : null,
      dineInOrder: order.dineInOrder
        ? {
            id: order.dineInOrder.id,
            tableId: order.dineInOrder.tableId,
            name: order.dineInOrder.name,
            guestCount: order.dineInOrder.guestCount,
            table: {
              id: order.dineInOrder.table.id,
              tableNumber: order.dineInOrder.table.tableNumber,
              name: order.dineInOrder.table.name,
              capacity: order.dineInOrder.table.capacity,
              status: order.dineInOrder.table.status,
            },
          }
        : null,
      orderNumber: order.orderNumber,
      totalAmount: order.totalAmount.toNumber(),
      totalQuantity: order.totalQuantity,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      orderItems: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        unitCost: item.unitCost.toNumber(),
        product: item.product,
      })),
    };
  }

  private validateOrderTypeDetails(
    dto: {
      type: OrderType;
      deliveryOrder?: CreateDeliveryOrderDto | UpdateDeliveryOrderDto;
      takeawayOrder?: CreateTakeawayOrderDto | UpdateTakeawayOrderDto;
      dineInOrder?: CreateDineInOrderDto | UpdateDineInOrderDto;
    },
    requireDetails: boolean,
  ) {
    const detailsByType = {
      [OrderType.DELIVERY]: dto.deliveryOrder,
      [OrderType.TAKEAWAY]: dto.takeawayOrder,
      [OrderType.DINE_IN]: dto.dineInOrder,
    };
    const providedTypes = Object.entries(detailsByType)
      .filter(([, details]) => details !== undefined && details !== null)
      .map(([orderType]) => orderType);

    if (
      providedTypes.some((providedType) => providedType !== dto.type) ||
      providedTypes.length > 1
    ) {
      throw new BadRequestException(
        'Only the detail object matching the order type may be provided',
      );
    }

    const details = detailsByType[dto.type];
    if (requireDetails && !details) {
      throw new BadRequestException(
        `${dto.type} orders require their matching detail object`,
      );
    }

    if (requireDetails && details) {
      const requiredFields: Record<OrderType, string[]> = {
        [OrderType.DELIVERY]: [
          'deliveryFee',
          'name',
          'address',
          'phone',
          'latitude',
          'longitude',
        ],
        [OrderType.TAKEAWAY]: ['name'],
        [OrderType.DINE_IN]: ['tableId'],
      };
      const missingFields = requiredFields[dto.type].filter(
        (field) => Reflect.get(details, field) === undefined,
      );
      if (missingFields.length) {
        throw new BadRequestException(
          `${dto.type} order details require: ${missingFields.join(', ')}`,
        );
      }
    }
  }

  private throwIfOrderTypeError(
    result: string | OrderRecord,
  ): asserts result is OrderRecord {
    if (typeof result !== 'string') {
      return;
    }
    if (result === 'type-details-required') {
      throw new BadRequestException(
        'The order type requires its matching detail object',
      );
    }
    if (result === 'table-not-found') {
      throw new NotFoundException(
        'The selected table was not found in this organization',
      );
    }
    if (result === 'guest-count-exceeds-capacity') {
      throw new BadRequestException(
        'guestCount cannot exceed the table capacity',
      );
    }
    if (result === 'type-detail-not-found') {
      throw new NotFoundException('Order type details were not found');
    }
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
