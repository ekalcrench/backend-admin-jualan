import { ApiProperty } from '@nestjs/swagger';

export class UserOrganizationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['MEMBER', 'ADMIN', 'OWNER'] })
  role!: string;

  @ApiProperty({
    enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUSPENDED'],
  })
  status!: string;

  @ApiProperty({ nullable: true })
  logoUrl!: string | null;
}
