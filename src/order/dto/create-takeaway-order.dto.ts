import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';
import { phoneExample } from '../../common/constants/api-value-example.constants.js';

export class CreateTakeawayOrderDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ maxLength: 16, example: phoneExample })
  @IsOptional()
  @IsString()
  @MaxLength(16)
  phone?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  pickUpTime?: Date;
}
