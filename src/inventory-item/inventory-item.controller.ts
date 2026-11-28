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
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { GetInventoryItemByPagesDto } from './dto/get-inventory-item-by-pages.dto.js';
import { GetInventoryItemByPagesResponseDto } from './dto/get-inventory-item-by-pages-response.dto.js';
import { InventoryItemResponseDto } from './dto/inventory-item-response.dto.js';
import { InventoryItemAssetsResponseDto } from './dto/inventory-item-assets-response.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { InventoryItemService } from './inventory-item.service.js';
import { InventoryItemOptionsResponseDto } from './dto/inventory-item-options-response.dto.js';
import { InventoryItemOptionsWithStockResponseDto } from './dto/inventory-item-options-with-stock-response.dto.js';
import { OrganizationUserRole } from '../../prisma/generated/prisma/enums.js';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.types.js';

@ApiTags('inventory-items')
@Controller('inventory-items')
export class InventoryItemController {
  constructor(private readonly inventoryItemService: InventoryItemService) {}

  @Get()
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve inventory items by pages' })
  @ApiOkResponse({ type: GetInventoryItemByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(
    @Query() query: GetInventoryItemByPagesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryItemService.findByPages(query, request.user);
  }

  @Get('options')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve all inventory items options' })
  @ApiOkResponse({ type: InventoryItemOptionsResponseDto, isArray: true })
  findOptions(@Req() request: AuthenticatedRequest) {
    return this.inventoryItemService.findOptions(request.user);
  }

  @Get('options/with-stock')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve all inventory items options with stock' })
  @ApiOkResponse({
    type: InventoryItemOptionsWithStockResponseDto,
    isArray: true,
  })
  findOptionsWithStock(@Req() request: AuthenticatedRequest) {
    return this.inventoryItemService.findOptionsWithStock(request.user);
  }

  @Get('assets')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve total inventory asset value' })
  @ApiOkResponse({ type: InventoryItemAssetsResponseDto })
  getAssets(@Req() request: AuthenticatedRequest) {
    return this.inventoryItemService.getAssets(request.user);
  }

  @Get(':id')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve an inventory item by id' })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiOkResponse({ type: InventoryItemResponseDto })
  @ApiNotFoundResponse({ description: 'Inventory item not found' })
  findById(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.inventoryItemService.findById(id, request.user);
  }

  @Post()
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Create an inventory item' })
  @ApiCreatedResponse({ type: InventoryItemResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiConflictResponse({ description: 'An item with this name already exists' })
  create(
    @Body() dto: CreateInventoryItemDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryItemService.create(dto, request.user);
  }

  @Patch(':id')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiOkResponse({ type: InventoryItemResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'Inventory item not found' })
  @ApiConflictResponse({ description: 'An item with this name already exists' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryItemService.update(id, dto, request.user);
  }

  @Delete(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Delete an inventory item' })
  @ApiParam({ name: 'id', description: 'Inventory item UUID' })
  @ApiOkResponse({
    description: 'Inventory item deleted successfully',
    type: Boolean,
  })
  @ApiNotFoundResponse({ description: 'Inventory item not found' })
  delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.inventoryItemService.delete(id, request.user);
  }
}
