import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { OrganizationContext } from '../common/types/organization-context.types.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { InventoryTransactionRepository } from './inventory-transaction.repository.js';
import { responseInclude } from './constants/response-include.constants.js';

@Injectable()
export class InventoryTransactionService {
  constructor(
    private readonly inventoryTransactionRepository: InventoryTransactionRepository,
  ) {}

  async findByPages(dto: GetByPagesDto, context: OrganizationContext) {
    const organizationId = this.requireOrganizationId(context);
    const { items, total } =
      await this.inventoryTransactionRepository.findByPages({
        ...dto,
        organizationId,
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

  private requireOrganizationId(context: OrganizationContext) {
    if (!context.organizationId) {
      throw new ForbiddenException('Organization context is required');
    }

    return context.organizationId;
  }

  private toResponse(
    transaction: Prisma.InventoryTransactionGetPayload<{
      include: typeof responseInclude;
    }>,
  ) {
    return {
      ...transaction,
      quantity: transaction.quantity.toNumber(),
    };
  }
}
