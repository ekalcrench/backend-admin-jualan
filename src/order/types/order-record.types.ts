import { OrderRepository } from '../order.repository.js';

export type OrderRecord = NonNullable<
  Awaited<ReturnType<OrderRepository['findById']>>
>;
