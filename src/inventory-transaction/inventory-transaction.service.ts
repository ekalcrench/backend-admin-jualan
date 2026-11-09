import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { InventoryTransactionRepository } from './inventory-transaction.repository.js';
import { responseInclude } from './constants/response-include.constants.js';
import { UserRequestHeader } from '../common/types/user-request-header.types.js';

@Injectable()
export class InventoryTransactionService {
  constructor(
    private readonly inventoryTransactionRepository: InventoryTransactionRepository,
  ) {}

  async findByPages(dto: GetByPagesDto, userHeader: UserRequestHeader) {
    const organizationId = this.requireOrganizationId(userHeader);
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

  private requireOrganizationId(userHeader: UserRequestHeader) {
    if (!userHeader.organizationId) {
      throw new ForbiddenException('Organization userHeader is required');
    }

    return userHeader.organizationId;
  }

  private toResponse(
    transaction: Prisma.InventoryTransactionGetPayload<{
      include: typeof responseInclude;
    }>,
  ) {
    return {
      ...transaction,
      quantity: transaction.quantity.toNumber(),
      unitCost: transaction.unitCost.toNumber(),
      totalCost: transaction.totalCost.toNumber(),
    };
  }
}
