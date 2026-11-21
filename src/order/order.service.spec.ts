import { jest } from '@jest/globals';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Prisma,
} from '../../prisma/generated/prisma/client.js';
import { OrderType } from '../../prisma/generated/prisma/enums.js';
import type { UserRequestHeader } from '../common/types/user-request-header.types.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { OrderRepository } from './order.repository.js';
import { OrderService } from './order.service.js';
import { OrderModifierValidationError } from '../product-modifier/errors/order-modifier-validation.error.js';
import type { OrderWithDetails } from './types/order-with-details.types.js';

const organizationId = '11111111-1111-4111-8111-111111111111';
const productId = '22222222-2222-4222-8222-222222222222';
const orderItemId = '33333333-3333-4333-8333-333333333333';
const modifierId = '44444444-4444-4444-8444-444444444444';
const modifierTwoId = '55555555-5555-4555-8555-555555555555';
const groupId = '66666666-6666-4666-8666-666666666666';
const referenceId = '77777777-7777-4777-8777-777777777777';
const createdAt = new Date('2026-11-21T00:00:00.000Z');

const user = {
  sub: 'user-id',
  name: 'Kasir',
  roles: [],
  organizationId,
  organization_roles: [],
  jwt_id: 'jwt-id',
} satisfies UserRequestHeader;

const buildModifier = (
  id: string,
  optionName: string,
  unitPrice: number,
  sortOrder: number,
) => ({
  id,
  orderItemId,
  modifierGroupId: groupId,
  modifierOptionId: optionName === 'Ayam Suwir' ? modifierId : modifierTwoId,
  groupName: 'Extra Isian',
  optionName,
  unitPrice: new Prisma.Decimal(unitPrice),
  sortOrder,
  createdAt,
});

const buildOrder = (): OrderWithDetails => ({
  id: 'order-id',
  organizationId,
  cashierId: 'user-id',
  customerId: null,
  orderNumber: 'INV-001',
  totalAmount: new Prisma.Decimal(55000),
  totalQuantity: 2,
  status: OrderStatus.UNPAID,
  type: OrderType.TAKEAWAY,
  referenceId,
  createdAt,
  updatedAt: createdAt,
  cashier: { name: 'Kasir' },
  takeawayOrder: {
    id: referenceId,
    name: 'Budi',
    phone: null,
    pickUpTime: createdAt,
    createdAt,
    updatedAt: createdAt,
  },
  deliveryOrder: null,
  dineInOrder: null,
  items: [
    {
      id: orderItemId,
      orderId: 'order-id',
      productId,
      quantity: 2,
      unitPrice: new Prisma.Decimal(20000),
      unitCost: new Prisma.Decimal(0),
      product: { id: productId, name: 'Soto Padang Ayam' },
      modifiers: [
        buildModifier(modifierId, 'Ayam Suwir', 2500, 0),
        buildModifier(modifierTwoId, 'Daging Kering', 5000, 1),
      ],
    },
  ],
});

const buildOrderWithoutModifiers = (): OrderWithDetails => {
  const order = buildOrder();
  order.totalAmount = new Prisma.Decimal(40000);
  order.items = [
    {
      ...order.items[0],
      unitPrice: new Prisma.Decimal(20000),
      modifiers: [],
    },
  ];

  return order;
};

type MockRepository = {
  [Key in keyof OrderRepository]: ReturnType<typeof jest.fn>;
};

const createRepository = (): MockRepository => ({
  findProductsByIds: jest.fn(),
  findUserById: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findOrderType: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  markPaid: jest.fn(),
  findByPages: jest.fn(),
  getOverview: jest.fn(),
  getOverviewItems: jest.fn(),
  getOverviewWithoutDateRange: jest.fn(),
  getOverviewWithDateRange: jest.fn(),
});

const createDto = (): CreateOrderDto => ({
  type: OrderType.TAKEAWAY,
  orderNumber: 'INV-001',
  takeawayOrder: { name: 'Budi' },
  orderItems: [
    {
      productId,
      quantity: 2,
      modifierOptionIds: [modifierId, modifierTwoId],
    },
  ],
});

describe('OrderService modifier integration', () => {
  let repository: MockRepository;
  let service: OrderService;

  beforeEach(() => {
    repository = createRepository();
    service = new OrderService(
      repository as unknown as OrderRepository,
    );
  });

  it('passes modifier option ids to the transaction and returns snapshot totals', async () => {
    repository.findProductsByIds.mockResolvedValue([
      { id: productId, sellingPrice: new Prisma.Decimal(20000) },
    ]);
    repository.create.mockResolvedValue(buildOrder());

    const dto = createDto();
    const result = await service.create(dto, user);

    expect(repository.create).toHaveBeenCalledWith(
      organizationId,
      'INV-001',
      'user-id',
      undefined,
      OrderType.TAKEAWAY,
      {
        deliveryOrder: undefined,
        takeawayOrder: { name: 'Budi' },
        dineInOrder: undefined,
      },
      dto.orderItems,
    );
    expect(result.totalAmount).toBe(55000);
    expect(result.orderItems[0]).toMatchObject({
      unitPrice: 20000,
      modifierTotal: 7500,
      unitTotal: 27500,
      subtotal: 55000,
    });
    expect(result.orderItems[0].modifiers.map((item) => item.optionName)).toEqual([
      'Ayam Suwir',
      'Daging Kering',
    ]);
  });

  it('keeps existing order behavior for a modifier-free product', async () => {
    repository.findProductsByIds.mockResolvedValue([
      { id: productId, sellingPrice: new Prisma.Decimal(20000) },
    ]);
    repository.create.mockResolvedValue(buildOrderWithoutModifiers());

    const result = await service.create(
      {
        ...createDto(),
        orderItems: [{ productId, quantity: 2 }],
      },
      user,
    );

    expect(result.orderItems[0]).toMatchObject({
      unitPrice: 20000,
      modifierTotal: 0,
      unitTotal: 20000,
      subtotal: 40000,
    });
    expect(result.orderItems[0].modifiers).toEqual([]);
  });

  it('maps modifier selection errors to 400', async () => {
    repository.findProductsByIds.mockResolvedValue([
      { id: productId, sellingPrice: new Prisma.Decimal(20000) },
    ]);
    repository.create.mockRejectedValue(
      new OrderModifierValidationError(
        'selection-min',
        'Modifier group "Tingkat Kematangan" requires at least 1 selection(s)',
      ),
    );

    await expect(service.create(createDto(), user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('maps a missing modifier product to 404', async () => {
    repository.findProductsByIds.mockResolvedValue([
      { id: productId, sellingPrice: new Prisma.Decimal(20000) },
    ]);
    repository.create.mockRejectedValue(
      new OrderModifierValidationError(
        'product-not-found',
        'One or more products were not found in this organization',
      ),
    );

    await expect(service.create(createDto(), user)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps an inactive product to 400', async () => {
    repository.findProductsByIds.mockResolvedValue([
      { id: productId, sellingPrice: new Prisma.Decimal(20000) },
    ]);
    repository.create.mockRejectedValue(
      new OrderModifierValidationError(
        'product-inactive',
        'Product "Soto Padang Ayam" is inactive and cannot be ordered',
      ),
    );

    await expect(service.create(createDto(), user)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns historical snapshots rather than current product modifier data', async () => {
    const historicalOrder = buildOrder();
    historicalOrder.items[0].product.name = 'Soto Padang Ayam (nama baru)';
    historicalOrder.items[0].modifiers[0].groupName = 'Extra Isian Lama';
    historicalOrder.items[0].modifiers[0].optionName = 'Ayam Suwir Lama';
    historicalOrder.items[0].modifiers[0].unitPrice = new Prisma.Decimal(2000);
    repository.findById.mockResolvedValue(historicalOrder);

    const result = await service.findById('order-id', user);

    expect(result.orderItems[0].product.name).toBe(
      'Soto Padang Ayam (nama baru)',
    );
    expect(result.orderItems[0].modifiers[0]).toMatchObject({
      groupName: 'Extra Isian Lama',
      optionName: 'Ayam Suwir Lama',
      unitPrice: 2000,
    });
    expect(result.orderItems[0].modifierTotal).toBe(7000);
    expect(result.orderItems[0].unitTotal).toBe(27000);
    expect(result.orderItems[0].subtotal).toBe(54000);
  });

  it('passes modifier selections through existing item updates', async () => {
    repository.findOrderType.mockResolvedValue({
      status: OrderStatus.UNPAID,
      type: OrderType.TAKEAWAY,
    });
    repository.update.mockResolvedValue(buildOrder());

    const dto: UpdateOrderDto = {
      orderItems: [{ id: orderItemId, modifierOptionIds: [modifierId] }],
    };

    await service.update('order-id', dto, user);

    expect(repository.update).toHaveBeenCalledWith(
      'order-id',
      organizationId,
      {},
      [
        {
          id: orderItemId,
          modifierOptionIds: [modifierId],
          itemData: {},
        },
      ],
      undefined,
      {
        deliveryOrder: undefined,
        takeawayOrder: undefined,
        dineInOrder: undefined,
      },
    );
  });
});
