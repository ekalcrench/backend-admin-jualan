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
import { OrganizationUserRole } from '../common/enums/organization-user-role.enum.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { OrderGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { OrderResponseDto } from './dto/order-response.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { OrderService } from './order.service.js';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.types.js';

@ApiTags('orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve orders by pages' })
  @ApiOkResponse({ type: OrderGetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(
    @Query() query: GetByPagesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.findByPages(query, request.user);
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
      'Create an order using current product selling prices for its items',
  })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiConflictResponse({
    description: 'An order with this number already exists',
  })
  @ApiNotFoundResponse({ description: 'One or more products were not found' })
  create(@Body() dto: CreateOrderDto, @Req() request: AuthenticatedRequest) {
    return this.orderService.create(dto, request.user);
  }

  @Patch(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary:
      'Update order details and items using current product selling prices; use deletedOrderItemIds to remove selected items',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiConflictResponse({
    description:
      'An order item with inventory consumption cannot have its product or quantity changed',
  })
  @ApiNotFoundResponse({ description: 'Order or order item not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.orderService.update(id, dto, request.user);
  }

  @Delete(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an order and its order items' })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOkResponse({
    description: 'Order and its order items deleted successfully',
    type: Boolean,
  })
  @ApiConflictResponse({
    description: 'An order with inventory consumption cannot be deleted',
  })
  @ApiNotFoundResponse({ description: 'Order not found' })
  delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.orderService.delete(id, request.user);
  }
}
