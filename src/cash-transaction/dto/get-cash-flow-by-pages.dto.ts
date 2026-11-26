import { ApiPropertyOptional } from '@nestjs/swagger';
import { DefaultGetByPagesDto } from '../../common/dto/default-get-by-pages.dto.js';
import { CashTransactionType } from '../../../prisma/generated/prisma/enums.js';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCashFlowByPagesDto extends DefaultGetByPagesDto {
  @ApiPropertyOptional({ enum: CashTransactionType })
  @IsEnum(CashTransactionType)
  @IsOptional()
  type?: CashTransactionType;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-01-01',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    example: '2026-01-31',
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;
}
