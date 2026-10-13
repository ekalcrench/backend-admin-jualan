import { GetByPagesDto } from '../dto/get-by-pages.dto.js';

export type FindByPagesParams = GetByPagesDto & {
  organizationId: string;
};
