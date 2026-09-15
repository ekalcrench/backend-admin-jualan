import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Page must be > 0' })
  @IsNotEmpty()
  page!: number;

  @ApiProperty({ example: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Size must be > 0' })
  @IsNotEmpty()
  size!: number;

  @ApiProperty({ example: '-createdAt' })
  @IsString()
  @IsNotEmpty()
  sortBy!: string;
}
