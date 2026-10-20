import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreatePreparationItemDto } from './create-preparation-item.dto.js';

export class CreatePreparationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  preparedAt!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  @IsOptional()
  @IsDateString()
  expiredAt?: string | null;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'Cara buat telur dadar',
  })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  outputInventoryItemId!: string;

  @ApiProperty({ example: 500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  outputQuantity!: number;

  @ApiProperty({ type: [CreatePreparationItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePreparationItemDto)
  preparationItems!: CreatePreparationItemDto[];
}
