import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReorderProductModifierGroupsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    uniqueItems: true,
    description:
      'Complete ordered list of the modifier groups currently assigned to the product. The array index becomes the new display order.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  modifierGroupIds!: string[];
}
