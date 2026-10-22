import { Injectable } from '@nestjs/common';
import {
  CashTransactionType,
  Prisma,
} from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { sortMap } from './constants/sort-map.constants.js';
import { FindByPagesParams } from './types/find-by-pages-params.types.js';

const editableTypes = [
  CashTransactionType.INVESTMENT,
  CashTransactionType.PROFIT_SHARING,
];

@Injectable()
export class CashTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByPages(data: FindByPagesParams) {
    const { page, size, sortBy, search, organizationId } = data;
    const where: Prisma.CashTransactionWhereInput = {
      organizationId,
      ...(search && {
        description: { contains: search, mode: 'insensitive' },
      }),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cashTransaction.findMany({
        skip: (page - 1) * size,
        take: size,
        where,
        orderBy: sortMap[sortBy] ?? sortMap['-transactionAt'],
      }),
      this.prisma.cashTransaction.count({ where }),
    ]);

    return { items, total };
  }

  findById(id: string, organizationId: string) {
    return this.prisma.cashTransaction.findFirst({
      where: { id, organizationId },
    });
  }

  create(data: Prisma.CashTransactionUncheckedCreateInput) {
    return this.prisma.cashTransaction.create({ data });
  }

  cashFlowByType(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const where: Prisma.CashTransactionWhereInput = { organizationId };
    if (startDate || endDate) {
      const transactionAt: { gte?: Date; lt?: Date } = {};
      if (startDate) {
        transactionAt.gte = startDate;
      }
      if (endDate) {
        const endDateExclusive = new Date(endDate);
        endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1);
        transactionAt.lt = endDateExclusive;
      }
      where.transactionAt = transactionAt;
    }

    return this.prisma.cashTransaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
    });
  }

  async update(
    id: string,
    organizationId: string,
    data: Prisma.CashTransactionUpdateManyMutationInput,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.cashTransaction.updateMany({
        where: { id, organizationId, type: { in: editableTypes } },
        data,
      });
      if (result.count === 1) {
        return transaction.cashTransaction.findFirstOrThrow({
          where: { id, organizationId },
        });
      }

      const existing = await transaction.cashTransaction.findFirst({
        where: { id, organizationId },
        select: { type: true },
      });
      if (!existing) {
        return 'not-found' as const;
      }

      return 'not-editable' as const;
    });
  }

  async delete(id: string, organizationId: string) {
    return this.prisma.$transaction(async (transaction) => {
      const result = await transaction.cashTransaction.deleteMany({
        where: { id, organizationId, type: { in: editableTypes } },
      });
      if (result.count === 1) {
        return true;
      }

      const existing = await transaction.cashTransaction.findFirst({
        where: { id, organizationId },
        select: { id: true },
      });
      return existing ? ('not-editable' as const) : ('not-found' as const);
    });
  }
}
