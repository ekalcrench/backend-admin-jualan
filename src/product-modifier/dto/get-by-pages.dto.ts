import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { DefaultGetByPagesDto } from '../../common/dto/default-get-by-pages.dto.js';
import { parseBooleanQuery } from './parse-boolean-query.transform.js';

export class GetByPagesDto extends DefaultGetByPagesDto {
  @ApiPropertyOptional({
    description: 'Filter modifier groups by active status',
  })
  @IsOptional()
  @Transform(parseBooleanQuery)
  @IsBoolean()
  isActive?: boolean;
}
