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
import type { Request } from 'express';
import { OrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import { OrganizationUserRole } from '../common/enums/organization-user-role.enum.js';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { InventoryItemGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { InventoryItemResponseDto } from './dto/inventory-item-response.dto.js';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto.js';
import { InventoryItemService } from './inventory-item.service.js';
import { GetInventoryItemOptionsDto } from './dto/get-inventory-item-options.dto.js';
import { InventoryItemOptionsResponseDto } from './dto/inventory-item-options-response.dto.js';

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
  @ApiOkResponse({ type: InventoryItemGetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(
    @Query() query: GetByPagesDto,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.inventoryItemService.findByPages(query, request.user);
  }

  @Get('options')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve inventory items options by search query' })
  @ApiOkResponse({ type: InventoryItemOptionsResponseDto, isArray: true })
  findOptions(
    @Query() query: GetInventoryItemOptionsDto,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.inventoryItemService.findOptions(query.search, request.user);
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
  findById(
    @Param('id') id: string,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
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
    @Req() request: Request & { user: { organizationId?: string } },
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
    @Req() request: Request & { user: { organizationId?: string } },
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
  delete(
    @Param('id') id: string,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.inventoryItemService.delete(id, request.user);
  }
}
