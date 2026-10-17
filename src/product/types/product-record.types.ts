import { ProductRepository } from '../product.repository.js';

export type ProductRecord = NonNullable<
  Awaited<ReturnType<ProductRepository['findById']>>
>;
