import { Prisma } from '../../../prisma/generated/prisma/client.js';

export const organizationUserResponseInclude = {
  user: {
    select: {
      name: true,
      email: true,
    },
  },
  approvedBy: {
    select: {
      name: true,
    },
  },
  updatedBy: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.OrganizationUserInclude;
