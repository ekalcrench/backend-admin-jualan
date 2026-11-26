import { TableDefaultParams } from '../../common/types/table-default-params.types.js';
import {
  OrganizationUserRole,
  OrganizationUserStatus,
} from '../../../prisma/generated/prisma/enums.js';

export type FindOrganizationUserByPagesParams = TableDefaultParams & {
  organizationId: string;
  role?: OrganizationUserRole;
  status?: OrganizationUserStatus;
};
