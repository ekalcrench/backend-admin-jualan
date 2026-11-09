import {
  OrganizationUserRole,
  UserRole,
} from '../../../prisma/generated/prisma/enums.js';

export type UserRequestHeader = {
  sub: string;
  name: string;
  roles: UserRole[];
  organizationId?: string;
  organization_roles: OrganizationUserRole[];
  jwt_id: string;
};
