import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';
import {
  pageExample,
  pageSizeExample,
  sortByExample,
} from '../constants/api-value-example.constants.js';

export class DefaultGetByPagesDto {
  @ApiProperty({ example: pageExample })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Page must be > 0' })
  @IsNotEmpty()
  page!: number;

  @ApiProperty({ example: pageSizeExample })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Size must be > 0' })
  @IsNotEmpty()
  size!: number;

  @ApiProperty({ example: sortByExample })
  @IsString()
  @IsNotEmpty()
  sortBy!: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}
