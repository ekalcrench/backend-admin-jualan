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
import { CreateProductDto } from './dto/create-product.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { ProductGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { ProductResponseDto } from './dto/product-response.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ProductService } from './product.service.js';

@ApiTags('products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve products by pages' })
  @ApiOkResponse({ type: ProductGetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(
    @Query() query: GetByPagesDto,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.productService.findByPages(query, request.user);
  }

  @Get(':id')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve a product by id' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiNotFoundResponse({ description: 'Product not found' })
  findById(
    @Param('id') id: string,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.productService.findById(id, request.user);
  }

  @Post()
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Create a product and its ingredients' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiConflictResponse({
    description: 'A product with this name already exists',
  })
  create(
    @Body() dto: CreateProductDto,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.productService.create(dto, request.user);
  }

  @Patch(':id')
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({
    summary:
      'Update a product and only supplied ingredient changes; omitted ingredients are unchanged',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiConflictResponse({
    description: 'A product with this name already exists',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.productService.update(id, dto, request.user);
  }

  @Delete(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a product and its ingredients' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse({
    description: 'Product and its ingredients deleted successfully',
    type: Boolean,
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @ApiConflictResponse({
    description: 'A product associated with orders cannot be deleted',
  })
  delete(
    @Param('id') id: string,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.productService.delete(id, request.user);
  }
}
