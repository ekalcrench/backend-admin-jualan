import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetUserOptionsDto {
  @ApiPropertyOptional({ description: 'Search user name or email' })
  @IsString()
  @IsOptional()
  search?: string;
}
