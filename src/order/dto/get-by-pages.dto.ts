import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { DefaultGetByPagesDto } from '../../common/dto/default-get-by-pages.dto.js';

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
