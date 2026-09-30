import { ApiProperty } from '@nestjs/swagger';

export class LoginOrganizationResponseDto {
  @ApiProperty({ description: 'Organization-scoped JWT access token' })
  accessToken!: string;
}
