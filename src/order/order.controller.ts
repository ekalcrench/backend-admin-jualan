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
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { OrderGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { GetOrderOverviewDto } from './dto/get-overview.dto.js';
import { OrderOverviewResponseDto } from './dto/order-overview-response.dto.js';
import { OrderOverviewItemsResponseDto } from './dto/order-overview-items-response.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { OrderService } from './order.service.js';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.types.js';
import { OrganizationUserRole } from '../../prisma/generated/prisma/enums.js';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve orders by pages' })
  @ApiOkResponse({ type: OrderGetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid date range' })
  findByPages(
    @Query() query: GetByPagesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.findByPages(query, request.user);
  }

  @Get('overview')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve overview for orders' })
  @ApiOkResponse({ type: OrderOverviewResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid date range' })
  getOverview(
    @Query() query: GetOrderOverviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.getOverview(query, request.user);
  }

  @Get('overview-items')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve the most and least sold order items' })
  @ApiOkResponse({ type: OrderOverviewItemsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid date range' })
  getOverviewItems(
    @Query() query: GetOrderOverviewDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.getOverviewItems(query, request.user);
  }

  @Get(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve an order by id' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiNotFoundResponse({ description: 'Order not found' })
  findById(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.orderService.findById(id, request.user);
  }

  @Post()
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary:
      'Create an unpaid order with type-specific details and current product selling prices',
  })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({
    description:
      'Invalid request payload or dine-in guest count exceeds table capacity',
  })
  @ApiConflictResponse({
    description: 'Stok untuk inventory item tidak mencukupi',
  })
  @ApiConflictResponse({
    description: 'An order with this number already exists',
  })
  @ApiNotFoundResponse({
    description:
      'A product was not found in this organization, or a customer or dine-in table was not found',
  })
  create(@Body() dto: CreateOrderDto, @Req() request: AuthenticatedRequest) {
    return this.orderService.create(dto, request.user);
  }

  @Post(':id/mark-paid')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Mark an unpaid order as paid' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiConflictResponse({
    description: 'Order is already paid or there is insufficient inventory',
  })
  @ApiNotFoundResponse({ description: 'Order not found' })
  markPaid(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.orderService.markPaid(id, request.user);
  }

  @Patch(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary:
      'Update an unpaid order and its type-specific details; use deletedOrderItemIds to remove selected items',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({
    description:
      'Invalid request payload or dine-in guest count exceeds table capacity',
  })
  @ApiConflictResponse({
    description: 'Paid orders cannot be updated',
  })
  @ApiNotFoundResponse({
    description: 'Order, order item, customer, or dine-in table not found',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.update(id, dto, request.user);
  }

  @Delete(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete an unpaid order',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({
    description:
      'Order, its items, and its type-specific details deleted successfully',
    type: Boolean,
  })
  @ApiConflictResponse({
    description: 'Paid orders cannot be deleted',
  })
  @ApiNotFoundResponse({ description: 'Order not found' })
  delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.orderService.delete(id, request.user);
  }
}
