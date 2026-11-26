import { GetInventoryItemByPagesDto } from '../dto/get-inventory-item-by-pages.dto.js';

export type FindInventoryItemByPagesParams = GetInventoryItemByPagesDto & {
  organizationId: string;
};
