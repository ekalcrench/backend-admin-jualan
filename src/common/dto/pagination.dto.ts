import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  pageExample,
  pageSizeExample,
  sortByExample,
} from '../constants/api-value-example.constants.js';

export class PaginationDto {
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
}
