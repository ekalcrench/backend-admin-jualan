import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator.js';
import { CreateUserDto } from '../auth/dto/create-user.dto.js';
import { CreateOrganizationDto } from '../organization/dto/create-organization.dto.js';
import { CreateInitOrganizationUserDto } from './dto/create-init-organization-user.dto.js';
import { InitService } from './init.service.js';

@ApiTags('init')
@Controller('init')
export class InitController {
  constructor(private readonly initService: InitService) {}

  @Public()
  @Post('user')
  @ApiOperation({ summary: 'Create a user without authentication' })
  @ApiCreatedResponse({ description: 'User created successfully' })
  createUser(@Body() dto: CreateUserDto) {
    return this.initService.createUser(dto);
  }

  @Public()
  @Post('organization')
  @ApiOperation({ summary: 'Create an organization without authentication' })
  @ApiCreatedResponse({ description: 'Organization created successfully' })
  createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.initService.createOrganization(dto);
  }

  @Public()
  @Post('organization-user')
  @ApiOperation({
    summary: 'Create an organization user without authentication',
  })
  @ApiCreatedResponse({ description: 'Organization user created successfully' })
  createOrganizationUser(@Body() dto: CreateInitOrganizationUserDto) {
    return this.initService.createOrganizationUser(dto);
  }
}
