import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { OrganizationService } from './organization.service.js';
import { CreateOrganizationDto } from './dto/create-organization.dto.js';
import { OrganizationResponseDto } from './dto/organization-response.dto.js';
import { UpdateOrganizationDto } from './dto/update-organization.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { OrganizationGetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve organizations by pages' })
  @ApiOkResponse({ type: OrganizationGetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(@Query() query: GetByPagesDto) {
    return this.organizationService.findByPages(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Retrieve an organization by id' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  findById(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiCreatedResponse({ type: OrganizationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update an organization by id' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an organization by id' })
  @ApiOkResponse({
    description: 'Organization deleted successfully',
    type: Boolean,
  })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  delete(@Param('id') id: string) {
    return this.organizationService.delete(id);
  }
}
