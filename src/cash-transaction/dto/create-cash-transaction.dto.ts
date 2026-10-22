import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { CashTransactionType } from '../../../prisma/generated/prisma/enums.js';

const editableTypes = [
  CashTransactionType.INVESTMENT,
  CashTransactionType.PROFIT_SHARING,
];

export class CreateCashTransactionDto {
  @ApiProperty({ enum: editableTypes })
  @IsIn(editableTypes)
  type!: (typeof editableTypes)[number];

  @ApiProperty({ minimum: 0.01, maximum: 9999999999999.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(9999999999999.99)
  amount!: number;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsString()
  @IsOptional()
  description?: string | null;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsDateString()
  @IsOptional()
  transactionAt?: string;
}
