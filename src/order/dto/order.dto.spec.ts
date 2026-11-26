import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  OrderStatus,
  OrderType,
} from '../../../prisma/generated/prisma/enums.js';
import { CreateOrderItemDto } from './create-order-item.dto.js';
import { GetOrderByPagesDto } from './get-order-by-pages.dto.js';
import { UpdateOrderItemDto } from './update-order-item.dto.js';

const productId = '11111111-1111-4111-8111-111111111111';
const optionId = '22222222-2222-4222-8222-222222222222';
const secondOptionId = '33333333-3333-4333-8333-333333333333';

const validatePayload = async <T extends object>(
  type: new () => T,
  payload: Record<string, unknown>,
) =>
  validate(plainToInstance(type, payload), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('Order modifier DTO validation', () => {
  it('accepts an order item with unique modifier option ids', async () => {
    const errors = await validatePayload(CreateOrderItemDto, {
      productId,
      quantity: 2,
      modifierOptionIds: [optionId, secondOptionId],
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects duplicate modifier option ids', async () => {
    const errors = await validatePayload(CreateOrderItemDto, {
      productId,
      quantity: 2,
      modifierOptionIds: [optionId, optionId],
    });

    expect(errors.map((error) => error.property)).toContain(
      'modifierOptionIds',
    );
  });

  it('rejects non-uuid modifier option ids', async () => {
    const errors = await validatePayload(CreateOrderItemDto, {
      productId,
      quantity: 1,
      modifierOptionIds: ['not-a-uuid'],
    });

    expect(errors.map((error) => error.property)).toContain(
      'modifierOptionIds',
    );
  });

  it('allows an update item to send only modifier option ids', async () => {
    const errors = await validatePayload(UpdateOrderItemDto, {
      id: productId,
      modifierOptionIds: [optionId],
    });

    expect(errors).toHaveLength(0);
  });

  it('allows an empty modifier option list to clear optional selections', async () => {
    const errors = await validatePayload(UpdateOrderItemDto, {
      id: productId,
      modifierOptionIds: [],
    });

    expect(errors).toHaveLength(0);
  });
});

describe('GetOrderByPagesDto validation', () => {
  const requiredPageParams = { page: 1, size: 10, sortBy: '-createdAt' };

  it('accepts valid order status and type filters', async () => {
    const errors = await validatePayload(GetOrderByPagesDto, {
      ...requiredPageParams,
      status: OrderStatus.UNPAID,
      type: OrderType.DINE_IN,
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid order status and type filters', async () => {
    const errors = await validatePayload(GetOrderByPagesDto, {
      ...requiredPageParams,
      status: 'INVALID',
      type: 'INVALID',
    });

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['status', 'type']),
    );
  });
});
