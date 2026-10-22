import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';
import { CashTransactionType } from '../../../prisma/generated/prisma/enums.js';

export class CashTransactionResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ enum: CashTransactionType })
  type!: CashTransactionType;

  @ApiProperty()
  amount!: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  description?: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    example: 'b32c35c6-0fdd-4edb-8535-aef15d1097e6',
    nullable: true,
  })
  referenceId?: string | null;

  @ApiProperty()
  transactionAt!: Date;
}
