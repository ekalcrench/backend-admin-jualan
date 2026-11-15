import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const organizationInclude = {
  socialMedias: { orderBy: { sortOrder: 'asc' } },
} satisfies Prisma.OrganizationInclude;
