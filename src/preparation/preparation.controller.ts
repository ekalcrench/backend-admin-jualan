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
import { CreatePreparationDto } from './dto/create-preparation.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { PreparationGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { PreparationResponseDto } from './dto/preparation-response.dto.js';
import { UpdatePreparationDto } from './dto/update-preparation.dto.js';
import { PreparationService } from './preparation.service.js';

@ApiTags('preparations')
@Controller('preparations')
export class PreparationController {
  constructor(private readonly preparationService: PreparationService) {}

  @Get()
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve preparations by pages' })
  @ApiOkResponse({ type: PreparationGetByPagesResponseDto })
  findByPages(
    @Query() query: GetByPagesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.preparationService.findByPages(query, request.user);
  }

  @Get(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve a preparation by id' })
  @ApiParam({ name: 'id', description: 'Preparation UUID' })
  @ApiOkResponse({ type: PreparationResponseDto })
  @ApiNotFoundResponse({ description: 'Preparation not found' })
  findById(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.preparationService.findById(id, request.user);
  }

  @Post()
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a draft preparation and reserve its ingredient inventory',
  })
  @ApiCreatedResponse({ type: PreparationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiConflictResponse({
    description:
      'There is not enough remaining inventory to complete preparation',
  })
  @ApiNotFoundResponse({
    description: 'One or more inventory items were not found',
  })
  create(
    @Body() dto: CreatePreparationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.preparationService.create(dto, request.user);
  }

  @Patch(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary:
      'Update a draft preparation; use deletedPreparationItemIds to remove items',
  })
  @ApiParam({ name: 'id', description: 'Preparation UUID' })
  @ApiOkResponse({ type: PreparationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiConflictResponse({
    description:
      'Insufficient inventory, the preparation output has already been consumed, or the preparation is completed',
  })
  @ApiNotFoundResponse({
    description: 'Preparation or one of its related records was not found',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePreparationDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.preparationService.update(id, dto, request.user);
  }

  @Post(':id/complete')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary: 'Complete a draft preparation and create its output lot',
  })
  @ApiParam({ name: 'id', description: 'Preparation UUID' })
  @ApiOkResponse({ type: PreparationResponseDto })
  @ApiConflictResponse({
    description:
      'Only draft preparations can be completed, or there is not enough ingredient inventory',
  })
  @ApiNotFoundResponse({ description: 'Preparation not found' })
  complete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.preparationService.complete(id, request.user);
  }

  @Delete(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a preparation and its preparation items' })
  @ApiParam({ name: 'id', description: 'Preparation UUID' })
  @ApiOkResponse({
    description: 'Preparation deleted successfully',
    type: Boolean,
  })
  @ApiConflictResponse({
    description: 'Preparation output has already been consumed',
  })
  @ApiForbiddenResponse({
    description:
      'Only an organization owner can delete a completed preparation',
  })
  @ApiNotFoundResponse({ description: 'Preparation not found' })
  delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.preparationService.delete(id, {
      organizationId: request.user.organizationId,
      organizationRoles: request.user.organization_roles,
    });
  }
}
