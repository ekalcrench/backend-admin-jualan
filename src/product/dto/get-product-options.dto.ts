import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

const parseBooleanQuery = ({ value }: { value: unknown }) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;

  return value;
};

export class GetProductOptionsDto {
  @ApiPropertyOptional({
    default: false,
    description:
      'When true, only active products are returned. Ordering clients must use this mode.',
  })
  @IsOptional()
  @Transform(parseBooleanQuery)
  @IsBoolean()
  activeOnly?: boolean;
}
