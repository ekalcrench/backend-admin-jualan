import { PartialType } from '@nestjs/swagger';
import { CreateOrganizationUserDto } from './create-organization-user.dto.js';

export class UpdateOrganizationUserDto extends PartialType(
  CreateOrganizationUserDto,
) {
  // @ApiPropertyOptional({ enum: UserRole })
  // @IsOptional()
  // role?: UserRole;
}
