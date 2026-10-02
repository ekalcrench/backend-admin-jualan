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
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { PurchasesGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { CreatePurchaseDto } from './dto/create-purchase.dto.js';
import { PurchaseResponseDto } from './dto/purchase-response.dto.js';
import { UpdatePurchaseDto } from './dto/update-purchase.dto.js';
import { PurchaseService } from './purchase.service.js';

type AuthenticatedRequest = Request & {
  user: { organizationId?: string };
};

@ApiTags('purchases')
@Controller('purchases')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve purchases by pages' })
  @ApiOkResponse({ type: PurchasesGetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(
    @Query() query: GetByPagesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.purchaseService.findByPages(query, request.user);
  }

  @Get(':id')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve a purchase by id' })
  @ApiParam({ name: 'id', description: 'Purchase UUID' })
  @ApiOkResponse({ type: PurchaseResponseDto })
  @ApiNotFoundResponse({ description: 'Purchase not found' })
  findById(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.purchaseService.findById(id, request.user);
  }

  @Post()
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a purchase and receive its inventory items',
  })
  @ApiCreatedResponse({ type: PurchaseResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiConflictResponse({ description: 'Purchase invoice already exists' })
  @ApiNotFoundResponse({ description: 'Inventory item not found' })
  create(@Body() dto: CreatePurchaseDto, @Req() request: AuthenticatedRequest) {
    return this.purchaseService.create(dto, request.user);
  }

  @Patch(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Update purchase details' })
  @ApiParam({ name: 'id', description: 'Purchase UUID' })
  @ApiOkResponse({ type: PurchaseResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiConflictResponse({ description: 'Purchase invoice already exists' })
  @ApiNotFoundResponse({ description: 'Purchase not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.purchaseService.update(id, dto, request.user);
  }

  @Delete(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete a purchase and its unconsumed inventory lots',
  })
  @ApiParam({ name: 'id', description: 'Purchase UUID' })
  @ApiOkResponse({
    description: 'Purchase deleted successfully',
    type: Boolean,
  })
  @ApiConflictResponse({
    description: 'Purchase inventory has already been consumed',
  })
  @ApiNotFoundResponse({ description: 'Purchase not found' })
  delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.purchaseService.delete(id, request.user);
  }
}
