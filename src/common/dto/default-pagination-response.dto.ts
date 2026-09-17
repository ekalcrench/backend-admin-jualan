import { ApiProperty } from '@nestjs/swagger';
import {
  pageExample,
  pageSizeExample,
  totalDataExample,
  totalPageExample,
} from '../constants/api-value-example.constants.js';

export class DefaultPaginationResponseDto {
  @ApiProperty({ example: pageExample })
  page!: number;

  @ApiProperty({ example: pageSizeExample })
  size!: number;

  @ApiProperty({ example: totalDataExample })
  total!: number;

  @ApiProperty({ example: totalPageExample })
  totalPages!: number;
}
