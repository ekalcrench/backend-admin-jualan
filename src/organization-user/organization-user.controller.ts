import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Query,
  HttpCode,
  HttpStatus,
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
import { OrganizationUserService } from './organization-user.service.js';
import { CreateOrganizationUserDto } from './dto/create-organization-user.dto.js';
import { UpdateOrganizationUserDto } from './dto/update-organization-user.dto.js';
import { OrganizationUserResponseDto } from './dto/organization-user-response.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { GetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import type { Request } from 'express';
import { OrganizationRoles } from '../auth/decorators/organization-roles.decorator.js';
import { OrganizationUserRole } from '../common/enums/organization-user-role.enum.js';

@ApiTags('organization-users')
@Controller('organization-users')
export class OrganizationUserController {
  constructor(
    private readonly organizationUserService: OrganizationUserService,
  ) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Retrieve organizations by pages' })
  @ApiOkResponse({ type: GetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(
    @Query() query: GetByPagesDto,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.organizationUserService.findByPages(query, request.user);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Retrieve a user by id' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOkResponse({ type: OrganizationUserResponseDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  findById(@Param('id') id: string) {
    return this.organizationUserService.findById(id);
  }

  @Post()
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user attach to organization' })
  @ApiCreatedResponse({ type: OrganizationUserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiConflictResponse({ description: 'User with this email already exists' })
  create(
    @Body() dto: CreateOrganizationUserDto,
    @Req() request: Request & { user: { organizationId?: string } },
  ) {
    return this.organizationUserService.create(dto, request.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a user by id' })
  @ApiOkResponse({ type: OrganizationUserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiConflictResponse({ description: 'Email already exists' })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationUserDto) {
    return this.organizationUserService.update(id, dto);
  }

  @Post(':id/suspend')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Change user status into SUSPEND' })
  @ApiOkResponse({ type: OrganizationUserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @HttpCode(HttpStatus.OK)
  suspend(@Param('id') id: string) {
    return this.organizationUserService.suspend(id);
  }

  @Post(':id/activate')
  @OrganizationRoles(OrganizationUserRole.OWNER, OrganizationUserRole.ADMIN)
  @ApiOperation({ summary: 'Change user status into ACTIVE' })
  @ApiOkResponse({ type: OrganizationUserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @HttpCode(HttpStatus.OK)
  activate(@Param('id') id: string) {
    return this.organizationUserService.activate(id);
  }

  @Post(':id/approve')
  @OrganizationRoles(OrganizationUserRole.OWNER)
  @ApiOperation({ summary: 'Approve organization user' })
  @ApiOkResponse({ type: OrganizationUserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @HttpCode(HttpStatus.OK)
  approve(@Param('id') id: string) {
    return this.organizationUserService.approve(id);
  }
}
