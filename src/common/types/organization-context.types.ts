import { OrganizationUserRole } from '../enums/organization-user-role.enum.js';

export type OrganizationContext = {
  organizationId?: string;
  organizationRoles?: OrganizationUserRole[];
};
