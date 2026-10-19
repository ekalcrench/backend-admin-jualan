import { Controller, Get, Query, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import { OrganizationUserRole } from '../common/enums/organization-user-role.enum.js';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.types.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { InventoryTransactionGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { InventoryTransactionService } from './inventory-transaction.service.js';

@ApiTags('inventory-transactions')
@Controller('inventory-transactions')
export class InventoryTransactionController {
  constructor(
    private readonly inventoryTransactionService: InventoryTransactionService,
  ) {}

  @Get()
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve inventory transactions by pages' })
  @ApiOkResponse({ type: InventoryTransactionGetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(
    @Query() query: GetByPagesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryTransactionService.findByPages(query, request.user);
  }
}
