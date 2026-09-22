import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
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
import { Roles } from '../auth/decorators/rolse.decorator.js';
import { UserRole } from '../common/enums/user-role.enum.js';
import { FileInterceptor } from '@nestjs/platform-express';
import type { FileUpload } from '../common/types/file-upload.types.js';
import { FileImageValidationPipe } from '../common/pipes/file-image-validation.pipe.js';
import { GetByPagesDto } from './dto/get-by-pages.dto.js';
import { GetByPagesResponseDto } from './dto/get-by-pages-response.dto.js';
import {
  addressExample,
  emailExample,
  logoUrlExample,
  organizationNameExample,
  phoneExample,
} from '../common/constants/api-value-example.constants.js';

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Retrieve organizations by pages' })
  @ApiOkResponse({ type: GetByPagesResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  findByPages(@Query() query: GetByPagesDto) {
    return this.organizationService.findByPages(query);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Retrieve an organization by id' })
  @ApiParam({ name: 'id', description: 'Organization UUID' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  findById(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: organizationNameExample },
        address: { type: 'string', example: addressExample },
        email: { type: 'email', example: emailExample },
        phone: { type: 'string', example: phoneExample },
        file: { type: 'string', format: 'binary' },
      },
      required: ['name', 'address', 'email', 'phone', 'file'],
    },
  })
  @ApiCreatedResponse({ type: OrganizationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  create(
    @Body() dto: CreateOrganizationDto,
    @UploadedFile(new FileImageValidationPipe()) file: FileUpload,
  ) {
    return this.organizationService.create(dto, file);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Update an organization by id' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: organizationNameExample },
        address: { type: 'string', example: addressExample },
        email: { type: 'email', example: emailExample },
        phone: { type: 'string', example: phoneExample },
        file: { type: 'string', format: 'binary' },
        logoUrl: { type: 'string', example: logoUrlExample },
      },
      // required: ['name', 'address', 'email', 'phone', 'file'],
    },
  })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @UploadedFile(new FileImageValidationPipe(false)) file?: FileUpload,
  ) {
    return this.organizationService.update(id, dto, file);
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
