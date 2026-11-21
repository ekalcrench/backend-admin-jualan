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
import type { AuthenticatedRequest } from '../common/types/authenticated-request.types.js';
import { OrganizationUserRole } from '../../prisma/generated/prisma/enums.js';
import { CreateProductModifierGroupDto } from './dto/create-product-modifier-group.dto.js';
import { CreateProductModifierOptionDto } from './dto/create-product-modifier-option.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { ProductModifierGroupGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { ProductModifierGroupDetailResponseDto } from './dto/product-modifier-group-detail-response.dto.js';
import { ProductModifierOptionResponseDto } from './dto/product-modifier-option-response.dto.js';
import { ReorderProductModifierOptionsDto } from './dto/reorder-product-modifier-options.dto.js';
import { UpdateModifierActiveStatusDto } from './dto/update-modifier-active-status.dto.js';
import { UpdateProductModifierGroupDto } from './dto/update-product-modifier-group.dto.js';
import { ProductModifierService } from './product-modifier.service.js';

@ApiTags('product-modifier-groups')
@Controller('product-modifier-groups')
export class ProductModifierGroupController {
  constructor(
    private readonly productModifierService: ProductModifierService,
  ) {}

  @Get()
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve product modifier groups by pages' })
  @ApiOkResponse({ type: ProductModifierGroupGetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(
    @Query() query: GetByPagesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.findByPages(query, request.user);
  }

  @Get(':id')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({
    summary: 'Retrieve a modifier group with its options and assigned products',
  })
  @ApiParam({ name: 'id', description: 'Modifier group UUID' })
  @ApiOkResponse({ type: ProductModifierGroupDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Modifier group not found' })
  findById(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.productModifierService.findById(id, request.user);
  }

  @Post()
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Create a reusable product modifier group' })
  @ApiCreatedResponse({ type: ProductModifierGroupDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid selection rules' })
  @ApiConflictResponse({
    description: 'A modifier group with this name already exists',
  })
  create(
    @Body() dto: CreateProductModifierGroupDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.create(dto, request.user);
  }

  @Post(':id/options')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Create an option inside a modifier group' })
  @ApiParam({ name: 'id', description: 'Modifier group UUID' })
  @ApiCreatedResponse({ type: ProductModifierOptionResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'Modifier group not found' })
  @ApiConflictResponse({
    description: 'An option with this name already exists in the group',
  })
  createOption(
    @Param('id') id: string,
    @Body() dto: CreateProductModifierOptionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.createOption(id, dto, request.user);
  }

  @Patch(':id/options/reorder')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary:
      'Reorder every option in a modifier group using the complete ordered id list',
  })
  @ApiParam({ name: 'id', description: 'Modifier group UUID' })
  @ApiOkResponse({
    type: ProductModifierOptionResponseDto,
    isArray: true,
  })
  @ApiBadRequestResponse({
    description: 'Option ids do not match the options in this group',
  })
  @ApiNotFoundResponse({ description: 'Modifier group not found' })
  reorderOptions(
    @Param('id') id: string,
    @Body() dto: ReorderProductModifierOptionsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.reorderOptions(id, dto, request.user);
  }

  @Patch(':id/status')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate a modifier group' })
  @ApiParam({ name: 'id', description: 'Modifier group UUID' })
  @ApiOkResponse({ type: ProductModifierGroupDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Modifier group not found' })
  setActive(
    @Param('id') id: string,
    @Body() dto: UpdateModifierActiveStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.setActive(id, dto, request.user);
  }

  @Patch(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Update a modifier group' })
  @ApiParam({ name: 'id', description: 'Modifier group UUID' })
  @ApiOkResponse({ type: ProductModifierGroupDetailResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid selection rules' })
  @ApiNotFoundResponse({ description: 'Modifier group not found' })
  @ApiConflictResponse({
    description: 'A modifier group with this name already exists',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductModifierGroupDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.update(id, dto, request.user);
  }

  @Delete(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary:
      'Delete a modifier group; a group assigned to products is deactivated instead',
  })
  @ApiParam({ name: 'id', description: 'Modifier group UUID' })
  @ApiOkResponse({
    description: 'Modifier group deleted or deactivated successfully',
    type: Boolean,
  })
  @ApiNotFoundResponse({ description: 'Modifier group not found' })
  delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.productModifierService.delete(id, request.user);
  }
}
