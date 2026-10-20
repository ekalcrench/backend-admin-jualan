import type { OrganizationUserRole } from '../enums/organization-user-role.enum.js';

export type AuthenticatedRequest = Request & {
  user: {
    organizationId?: string;
    organization_roles?: OrganizationUserRole[];
  };
};
