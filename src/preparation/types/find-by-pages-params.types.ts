import { GetPreparationByPagesDto } from '../dto/get-preparation-by-pages.dto.js';

export type FindByPagesParams = GetPreparationByPagesDto & {
  organizationId: string;
};
