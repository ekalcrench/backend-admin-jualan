import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { CreateOrganizationUserDto } from '../../organization-user/dto/create-organization-user.dto.js';

export class CreateInitOrganizationUserDto extends CreateOrganizationUserDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  organizationId!: string;
}
