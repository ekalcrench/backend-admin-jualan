import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../common/dto/base-response.dto.js';

export class ProductModifierOptionResponseDto extends BaseResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  modifierGroupId!: string;

  @ApiProperty({ maxLength: 255, example: 'Ayam Suwir' })
  name!: string;

  @ApiProperty({
    maxLength: 2000,
    nullable: true,
    example: 'Ayam suwir pedas',
  })
  description!: string | null;

  @ApiProperty({
    example: 2500,
    minimum: 0,
    description: 'Additional amount added to the product selling price',
  })
  price!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 0, minimum: 0 })
  sortOrder!: number;
}
