import { ApiProperty } from '@nestjs/swagger';

export class DefaultPaginationResponseDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  size!: number;

  @ApiProperty({ example: 125 })
  total!: number;

  @ApiProperty({ example: 7 })
  totalPages!: number;
}
