import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { CashTransactionType } from '../../../prisma/generated/prisma/enums.js';

const editableTypes = [
  CashTransactionType.INVESTMENT,
  CashTransactionType.PROFIT_SHARING,
];

export class UpdateCashTransactionDto {
  @ApiPropertyOptional({ enum: editableTypes })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsIn(editableTypes)
  type?: (typeof editableTypes)[number];

  @ApiPropertyOptional({ minimum: 0.01, maximum: 9999999999999.99 })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9999999999999.99)
  amount?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ format: 'date-time' })
  @ValidateIf((_, value: unknown) => value !== undefined)
  @IsDateString()
  transactionAt?: string;
}
