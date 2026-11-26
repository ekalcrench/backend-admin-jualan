import { GetOrderByPagesDto } from '../dto/get-order-by-pages.dto.js';

export type OrderFindByPagesParams = GetOrderByPagesDto & {
  organizationId: string;
};
