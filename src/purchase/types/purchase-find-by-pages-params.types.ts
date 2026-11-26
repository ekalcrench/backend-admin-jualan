import { GetPurchaseByPagesDto } from '../dto/get-purchase-by-pages.dto.js';

export type PurchaseFindByPagesParams = GetPurchaseByPagesDto & {
  organizationId: string;
};
