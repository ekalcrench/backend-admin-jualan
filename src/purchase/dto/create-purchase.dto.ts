import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreatePurchaseItemDto } from './create-purchase-item.dto.js';
import {
  invoiceExample,
  supplierNameExample,
} from '../../common/constants/api-value-example.constants.js';

export class CreatePurchaseDto {
  @ApiProperty({ description: supplierNameExample })
  @IsString()
  @IsNotEmpty()
  supplierName!: string;

  @ApiProperty({ description: invoiceExample })
  @IsString()
  @IsNotEmpty()
  invoiceNumber!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  purchasedAt!: string;

  @ApiProperty({ type: [CreatePurchaseItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  purchaseItems!: CreatePurchaseItemDto[];
}
