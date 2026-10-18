import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { CreatePreparationDto } from './create-preparation.dto.js';
import { UpdatePreparationItemDto } from './update-preparation-item.dto.js';

export class UpdatePreparationDto extends PartialType(
  OmitType(CreatePreparationDto, ['preparationItems'] as const),
) {
  @ApiPropertyOptional({ type: [UpdatePreparationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdatePreparationItemDto)
  preparationItems?: UpdatePreparationItemDto[];

  @ApiPropertyOptional({ type: [String], format: 'uuid', uniqueItems: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  deletedPreparationItemIds?: string[];
}
