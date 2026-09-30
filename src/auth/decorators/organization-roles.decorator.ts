import { SetMetadata } from '@nestjs/common';
import { OrganizationUserRole } from '../../common/enums/organization-user-role.enum.js';

export const ORGANIZATION_ROLES_KEY = 'organization_roles';
export const Roles = (...roles: OrganizationUserRole[]) =>
  SetMetadata(ORGANIZATION_ROLES_KEY, roles);
