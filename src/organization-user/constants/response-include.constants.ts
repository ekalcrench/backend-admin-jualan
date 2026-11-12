import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const organizationUserResponseInclude = {
  user: {
    select: {
      name: true,
      email: true,
    },
  },
} satisfies Prisma.OrganizationUserInclude;
