import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { GetInventoryLotsByPagesDto } from './dto/get-inventory-lots-by-pages.dto.js';
import { InventoryLotGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { InventoryLotResponseDto } from './dto/inventory-lot-response.dto.js';
import { UpdateInventoryLotDto } from './dto/update-inventory-lot.dto.js';
import { InventoryLotService } from './inventory-lot.service.js';
import type { AuthenticatedRequest } from '../common/types/authenticated-request.types.js';
import { OrganizationUserRole } from '../../prisma/generated/prisma/enums.js';

@ApiTags('inventory-lots')
@Controller('inventory-lots')
export class InventoryLotController {
  constructor(private readonly inventoryLotService: InventoryLotService) {}

  @Get()
  @OrganizationRoles(
    OrganizationUserRole.OWNER,
    OrganizationUserRole.ADMIN,
    OrganizationUserRole.MEMBER,
  )
  @ApiOperation({ summary: 'Retrieve inventory lots by pages' })
  @ApiOkResponse({ type: InventoryLotGetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(
    @Query() query: GetInventoryLotsByPagesDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryLotService.findByPages(query, request.user);
  }

  @Patch(':id')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Update an inventory lot' })
  @ApiParam({ name: 'id', description: 'Inventory lot UUID' })
  @ApiOkResponse({ type: InventoryLotResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'Inventory lot not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryLotDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.inventoryLotService.update(id, dto, request.user);
  }
}
