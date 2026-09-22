import {
  UserRole,
  UserStatus,
} from '../../../prisma/generated/prisma/enums.js';
import { TableDefaultParams } from '../../common/types/table-default-params.types.js';

export type FindByPagesParams = TableDefaultParams & {
  role?: UserRole;
  status?: UserStatus;
};
