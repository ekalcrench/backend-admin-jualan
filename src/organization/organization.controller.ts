import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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

@ApiTags('organizations')
@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Retrieve all organizations' })
  @ApiOkResponse({ type: [OrganizationResponseDto] })
  findAll() {
    return this.organizationService.findAll();
  }

  @Get(':id')
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
        name: { type: 'string', example: 'Azmi Company' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['name', 'file'],
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
  @ApiOperation({ summary: 'Update an organization by id' })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization by id' })
  @ApiOkResponse({ description: 'Organization deleted successfully' })
  @ApiNotFoundResponse({ description: 'Organization not found' })
  delete(@Param('id') id: string) {
    return this.organizationService.delete(id);
  }

  @Put(':organizationId/logo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Change an organization logo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiBadRequestResponse({ description: 'An image file is required' })
  uploadLogo(
    @Param('organizationId') organizationId: string,
    @UploadedFile(new FileImageValidationPipe()) file: FileUpload,
  ) {
    return this.organizationService.uploadLogo(organizationId, file);
  }
}
