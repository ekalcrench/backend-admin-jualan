import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';
import { PurchaseStatus } from '../../../prisma/generated/prisma/enums.js';
import { DefaultGetByPagesDto } from '../../common/dto/default-get-by-pages.dto.js';

export class GetPurchaseByPagesDto extends DefaultGetByPagesDto {
  @ApiPropertyOptional({ enum: PurchaseStatus })
  @IsEnum(PurchaseStatus)
  @IsOptional()
  status?: PurchaseStatus;

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
