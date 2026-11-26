import { GetCashFlowByPagesDto } from '../dto/get-cash-flow-by-pages.dto.js';

export type FindCashFlowByPagesParams = GetCashFlowByPagesDto & {
  organizationId: string;
};
