import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';

export class ProductModifierGroupResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organizationId!: string;

  @ApiProperty({ maxLength: 255, example: 'Extra Isian' })
  name!: string;

  @ApiProperty({ maxLength: 2000, nullable: true })
  description!: string | null;

  @ApiProperty({ example: false })
  isRequired!: boolean;

  @ApiProperty({ example: 0, minimum: 0 })
  minSelection!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  maxSelection!: number;

  @ApiProperty({ example: false })
  isMultiple!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 0, minimum: 0 })
  sortOrder!: number;

  @ApiProperty({ example: 3, minimum: 0 })
  optionsCount!: number;

  @ApiProperty({ example: 2, minimum: 0 })
  assignedProductsCount!: number;
}
