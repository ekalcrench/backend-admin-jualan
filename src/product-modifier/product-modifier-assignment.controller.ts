import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.types.js';
import { OrganizationUserRole } from '../../prisma/generated/prisma/enums.js';
import { GetProductModifierGroupsDto } from './dto/get-product-modifier-groups.dto.js';
import { ProductModifierGroupsResponseDto } from './dto/product-modifier-groups-response.dto.js';
import { ReorderProductModifierGroupsDto } from './dto/reorder-product-modifier-groups.dto.js';
import { ReplaceProductModifierGroupsDto } from './dto/replace-product-modifier-groups.dto.js';
import { ProductModifierService } from './product-modifier.service.js';

@ApiTags('product-modifier-assignments')
@Controller('products/:productId/modifier-groups')
export class ProductModifierAssignmentController {
  constructor(
    private readonly productModifierService: ProductModifierService,
  ) {}

  @Get()
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({
    summary: 'Retrieve all modifier groups and options assigned to a product',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiOkResponse({ type: ProductModifierGroupsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  find(
    @Param('productId') productId: string,
    @Query() query: GetProductModifierGroupsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.findProductModifierGroups(
      productId,
      query,
      request.user,
    );
  }

  @Put()
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary:
      'Replace the modifier groups assigned to a product, in the supplied order',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiOkResponse({ type: ProductModifierGroupsResponseDto })
  @ApiBadRequestResponse({
    description:
      'Duplicate ids, or groups that do not belong to this organization',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  replace(
    @Param('productId') productId: string,
    @Body() dto: ReplaceProductModifierGroupsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.replaceProductModifierGroups(
      productId,
      dto,
      request.user,
    );
  }

  @Patch('reorder')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({
    summary:
      'Reorder the modifier groups assigned to a product using the complete ordered id list',
  })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiOkResponse({ type: ProductModifierGroupsResponseDto })
  @ApiBadRequestResponse({
    description: 'Ids do not match the groups assigned to this product',
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  reorder(
    @Param('productId') productId: string,
    @Body() dto: ReorderProductModifierGroupsDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.reorderProductModifierGroups(
      productId,
      dto,
      request.user,
    );
  }

  @Delete(':modifierGroupId')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Remove a modifier group from a product' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'modifierGroupId', description: 'Modifier group UUID' })
  @ApiOkResponse({
    description: 'Modifier group removed from the product',
    type: Boolean,
  })
  @ApiNotFoundResponse({
    description: 'Product not found, or group not assigned to the product',
  })
  remove(
    @Param('productId') productId: string,
    @Param('modifierGroupId') modifierGroupId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.removeProductModifierGroup(
      productId,
      modifierGroupId,
      request.user,
    );
  }
}
