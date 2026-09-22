import { TableDefaultParams } from '../../common/types/table-default-params.types.js';

export type FindByPagesParams = TableDefaultParams & {
  organizationId?: string;
};
