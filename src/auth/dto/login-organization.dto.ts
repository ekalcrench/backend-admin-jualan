import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class LoginOrganizationDto {
  @ApiProperty({ description: 'Organization UUID' })
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;
}
