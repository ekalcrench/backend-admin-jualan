import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import { OrganizationUserRole } from '../common/enums/organization-user-role.enum.js';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.types.js';
import { CashTransactionGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { CashTransactionResponseDto } from './dto/cash-transaction-response.dto.js';
import { CreateCashTransactionDto } from './dto/create-cash-transaction.dto.js';
import { GetBalanceDto } from './dto/get-balance.dto.js';
import { UpdateCashTransactionDto } from './dto/update-cash-transaction.dto.js';
import { CashTransactionService } from './cash-transaction.service.js';

@ApiTags('cash-transactions')
@Controller('cash-transactions')
export class CashTransactionController {
  constructor(
    private readonly cashTransactionService: CashTransactionService,
  ) {}

  @Get()
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve cash transactions by pages' })
  @ApiOkResponse({ type: CashTransactionGetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(
    @Query() query: GetByPagesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cashTransactionService.findByPages(query, request.user);
  }

  @Get('balance')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve the organization cash balance' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        remainingCash: { type: 'number' },
        cashIn: { type: 'number' },
        cashOut: { type: 'number' },
        netCashFlow: { type: 'number' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid date range' })
  getBalance(
    @Query() query: GetBalanceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cashTransactionService.getBalance(query, request.user);
  }

  @Get(':id')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve a cash transaction by id' })
  @ApiParam({ name: 'id', description: 'Cash transaction UUID' })
  @ApiOkResponse({ type: CashTransactionResponseDto })
  @ApiNotFoundResponse({ description: 'Cash transaction not found' })
  findById(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.cashTransactionService.findById(id, request.user);
  }

  @Post()
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary: 'Create an investment or profit-sharing cash transaction',
  })
  @ApiCreatedResponse({ type: CashTransactionResponseDto })
  @ApiBadRequestResponse({
    description:
      'Only INVESTMENT and PROFIT_SHARING transactions can be created',
  })
  create(
    @Body() dto: CreateCashTransactionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cashTransactionService.create(dto, request.user);
  }

  @Patch(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary: 'Update an investment or profit-sharing transaction',
  })
  @ApiParam({ name: 'id', description: 'Cash transaction UUID' })
  @ApiOkResponse({ type: CashTransactionResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiForbiddenResponse({
    description:
      'Only INVESTMENT and PROFIT_SHARING transactions can be updated',
  })
  @ApiNotFoundResponse({ description: 'Cash transaction not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCashTransactionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.cashTransactionService.update(id, dto, request.user);
  }

  @Delete(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete an investment or profit-sharing transaction',
  })
  @ApiParam({ name: 'id', description: 'Cash transaction UUID' })
  @ApiOkResponse({ description: 'Cash transaction deleted successfully' })
  @ApiForbiddenResponse({
    description:
      'Only INVESTMENT and PROFIT_SHARING transactions can be deleted',
  })
  @ApiNotFoundResponse({ description: 'Cash transaction not found' })
  delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.cashTransactionService.delete(id, request.user);
  }
}
