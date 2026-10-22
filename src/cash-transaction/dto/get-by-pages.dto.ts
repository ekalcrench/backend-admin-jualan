import { ApiPropertyOptional } from '@nestjs/swagger';
import { DefaultGetByPagesDto } from '../../common/dto/default-get-by-pages.dto.js';
import { IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetByPagesDto extends DefaultGetByPagesDto {
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
