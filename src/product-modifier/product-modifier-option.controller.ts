import { Body, Controller, Delete, Param, Patch, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.types.js';
import { OrganizationUserRole } from '../../prisma/generated/prisma/enums.js';
import { ProductModifierOptionResponseDto } from './dto/product-modifier-option-response.dto.js';
import { UpdateModifierActiveStatusDto } from './dto/update-modifier-active-status.dto.js';
import { UpdateProductModifierOptionDto } from './dto/update-product-modifier-option.dto.js';
import { ProductModifierService } from './product-modifier.service.js';

@ApiTags('product-modifier-options')
@Controller('product-modifier-options')
export class ProductModifierOptionController {
  constructor(
    private readonly productModifierService: ProductModifierService,
  ) {}

  @Patch(':id/status')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate a modifier option' })
  @ApiParam({ name: 'id', description: 'Modifier option UUID' })
  @ApiOkResponse({ type: ProductModifierOptionResponseDto })
  @ApiNotFoundResponse({ description: 'Modifier option not found' })
  setActive(
    @Param('id') id: string,
    @Body() dto: UpdateModifierActiveStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.setOptionActive(id, dto, request.user);
  }

  @Patch(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Update a modifier option' })
  @ApiParam({ name: 'id', description: 'Modifier option UUID' })
  @ApiOkResponse({ type: ProductModifierOptionResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'Modifier option not found' })
  @ApiConflictResponse({
    description: 'An option with this name already exists in the group',
  })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProductModifierOptionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.productModifierService.updateOption(id, dto, request.user);
  }

  @Delete(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a modifier option' })
  @ApiParam({ name: 'id', description: 'Modifier option UUID' })
  @ApiOkResponse({
    description: 'Modifier option deleted successfully',
    type: Boolean,
  })
  @ApiNotFoundResponse({ description: 'Modifier option not found' })
  delete(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.productModifierService.deleteOption(id, request.user);
  }
}
