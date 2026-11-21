import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { parseBooleanQuery } from './parse-boolean-query.transform.js';

export class GetProductModifierGroupsDto {
  @ApiPropertyOptional({
    default: false,
    description:
      'When true, inactive modifier groups and options are excluded. Customer ordering clients must use this mode.',
  })
  @IsOptional()
  @Transform(parseBooleanQuery)
  @IsBoolean()
  activeOnly?: boolean;
}
