import { Controller, Get, Query, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { OrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import { OrganizationUserRole } from '../common/enums/organization-user-role.enum.js';
import { GetInventoryLotsByPagesDto } from './dto/get-inventory-lots-by-pages.dto.js';
import { InventoryLotGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { InventoryLotService } from './inventory-lot.service.js';

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
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.inventoryLotService.findByPages(query, request.user);
  }
}
