import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CashTransactionType,
  Prisma,
} from '../../prisma/generated/prisma/client.js';
import { OrganizationContext } from '../common/types/organization-context.types.js';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto.js';
import { GetBalanceDto } from './dto/get-balance.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto.js';
import { CashTransactionRepository } from './cash-transaction.repository.js';
import { GetCashFlowDto } from './dto/get-cash-flow.dto.js';
import { GetBalanceResponseDto } from './dto/get-balance-response.dto.js';
import { GetCashFlowResponseDto } from './dto/get-cash-flow-response.dto.js';

@Injectable()
export class CashTransactionService {
  constructor(
    private readonly cashTransactionRepository: CashTransactionRepository,
  ) {}

  async findByPages(dto: GetByPagesDto, context: OrganizationContext) {
    const { items, total } = await this.cashTransactionRepository.findByPages({
      ...dto,
      organizationId: this.requireOrganizationId(context),
    });

    return {
      items: items.map((item) => this.toResponse(item)),
      pagination: {
        page: dto.page,
        size: dto.size,
        total,
        totalPages: Math.ceil(total / dto.size),
      },
    };
  }

  async findById(id: string, context: OrganizationContext) {
    const transaction = await this.cashTransactionRepository.findById(
      id,
      this.requireOrganizationId(context),
    );
    if (!transaction) {
      throw new NotFoundException('Cash transaction not found');
    }

    return this.toResponse(transaction);
  }

  async getBalance(
    dto: GetBalanceDto,
    context: OrganizationContext,
  ): Promise<GetBalanceResponseDto> {
    const balances = await this.cashTransactionRepository.balance(
      this.requireOrganizationId(context),
      dto.endDate,
    );

    const total = balances.reduce((sum, group) => {
      const amount = group._sum.amount ?? new Prisma.Decimal(0);
      switch (group.type) {
        case CashTransactionType.PURCHASE:
        case CashTransactionType.PROFIT_SHARING:
          return sum.minus(amount);
        case CashTransactionType.SALE:
        case CashTransactionType.INVESTMENT:
          return sum.plus(amount);
      }
    }, new Prisma.Decimal(0));

    return {
      balance: total.toNumber(),
    };
  }

  async getCashFlow(
    dto: GetCashFlowDto,
    context: OrganizationContext,
  ): Promise<GetCashFlowResponseDto> {
    if (
      dto.startDate &&
      dto.endDate &&
      dto.startDate.getTime() > dto.endDate.getTime()
    ) {
      throw new BadRequestException(
        'startDate must be before or equal to endDate',
      );
    }

    const cashFlow = await this.cashTransactionRepository.cashFlowByType(
      this.requireOrganizationId(context),
      dto.startDate,
      dto.endDate,
    );
    const previousRange = this.getPreviousDateRange(dto.startDate, dto.endDate);
    const previousCashFlow = previousRange
      ? await this.cashTransactionRepository.cashFlowByType(
          this.requireOrganizationId(context),
          previousRange.startDate,
          previousRange.endDate,
        )
      : [];
    const totals = this.sumCashFlow(cashFlow);
    const previousTotals = this.sumCashFlow(previousCashFlow);

    return {
      cashIn: totals.cashIn.toNumber(),
      cashOut: totals.cashOut.toNumber(),
      prevCashIn: previousTotals.cashIn.toNumber(),
      prevCashOut: previousTotals.cashOut.toNumber(),
    };
  }

  private sumCashFlow(
    cashFlow: Array<{
      type: CashTransactionType;
      _sum: { amount: Prisma.Decimal | null };
    }>,
  ) {
    return cashFlow.reduce(
      (result, group) => {
        const amount = group._sum?.amount ?? new Prisma.Decimal(0);
        switch (group.type) {
          case CashTransactionType.PURCHASE:
          case CashTransactionType.PROFIT_SHARING:
            result.cashOut = result.cashOut.plus(amount);
            break;
          case CashTransactionType.SALE:
          case CashTransactionType.INVESTMENT:
            result.cashIn = result.cashIn.plus(amount);
            break;
        }
        return result;
      },
      {
        cashIn: new Prisma.Decimal(0),
        cashOut: new Prisma.Decimal(0),
      },
    );
  }

  private getPreviousDateRange(
    startDate?: Date,
    endDate?: Date,
  ): { startDate?: Date; endDate?: Date } | undefined {
    if (!startDate && !endDate) {
      return undefined;
    }

    if (startDate && endDate) {
      const currentEndExclusive = new Date(endDate);
      currentEndExclusive.setUTCDate(currentEndExclusive.getUTCDate() + 1);
      const periodDuration =
        currentEndExclusive.getTime() - startDate.getTime();

      return {
        startDate: new Date(startDate.getTime() - periodDuration),
        endDate: new Date(startDate.getTime() - 1),
      };
    }

    if (startDate) {
      return { endDate: new Date(startDate.getTime() - 1) };
    }

    return {
      startDate: new Date(endDate!.getTime() - 86_400_000),
      endDate: new Date(endDate!.getTime() - 86_400_000),
    };
  }

  async create(dto: CreateCashTransactionDto, context: OrganizationContext) {
    this.assertEditableType(dto.type);
    const transaction = await this.cashTransactionRepository.create({
      organizationId: this.requireOrganizationId(context),
      type: dto.type,
      amount: dto.amount,
      description: dto.description,
      transactionAt: dto.transactionAt
        ? new Date(dto.transactionAt)
        : undefined,
    });

    return this.toResponse(transaction);
  }

  async update(
    id: string,
    dto: UpdateCashTransactionDto,
    context: OrganizationContext,
  ) {
    if (dto.type !== undefined) {
      this.assertEditableType(dto.type);
    }
    const data: Prisma.CashTransactionUpdateManyMutationInput = {
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.amount !== undefined && { amount: dto.amount }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.transactionAt !== undefined && {
        transactionAt: new Date(dto.transactionAt),
      }),
    };
    if (Object.keys(data).length === 0) {
      throw new BadRequestException(
        'At least one cash transaction field must be provided',
      );
    }

    const transaction = await this.cashTransactionRepository.update(
      id,
      this.requireOrganizationId(context),
      data,
    );

    if (transaction === 'not-found') {
      throw new NotFoundException('Cash transaction not found');
    }
    if (transaction === 'not-editable') {
      throw new ForbiddenException(
        'Only INVESTMENT and PROFIT_SHARING transactions can be updated',
      );
    }

    return this.toResponse(transaction);
  }

  async delete(id: string, context: OrganizationContext) {
    const result = await this.cashTransactionRepository.delete(
      id,
      this.requireOrganizationId(context),
    );
    if (result === 'not-found') {
      throw new NotFoundException('Cash transaction not found');
    }
    if (result === 'not-editable') {
      throw new ForbiddenException(
        'Only INVESTMENT and PROFIT_SHARING transactions can be deleted',
      );
    }

    return result;
  }

  private assertEditableType(type: CashTransactionType) {
    if (
      type !== CashTransactionType.INVESTMENT &&
      type !== CashTransactionType.PROFIT_SHARING
    ) {
      throw new BadRequestException(
        'Only INVESTMENT and PROFIT_SHARING cash transactions can be created or updated',
      );
    }
  }

  private requireOrganizationId(context: OrganizationContext) {
    if (!context.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    return context.organizationId;
  }

  private toResponse(
    transaction: Prisma.CashTransactionGetPayload<Record<string, never>>,
  ) {
    return { ...transaction, amount: transaction.amount.toNumber() };
  }
}
