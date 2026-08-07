import { Provider } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';
// import { PrismaClient } from '../../prisma/generated/client.js';

export const PRISMA = Symbol('PRISMA');

export const PrismaProvider: Provider = {
  provide: PRISMA,
  useFactory: () => {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });

    return new PrismaClient({
      adapter,
    });
  },
};
