import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateInventoryLotDto {
  @ApiPropertyOptional({ minimum: 0, maximum: 9999999999999.99 })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999999.99)
  remainingQuantity?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsDateString()
  receivedAt?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    nullable: true,
    example: new Date(),
  })
  @IsOptional()
  @IsDateString()
  expiredAt?: string | null;
}
