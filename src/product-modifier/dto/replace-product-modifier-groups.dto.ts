import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReplaceProductModifierGroupsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    uniqueItems: true,
    description:
      'Complete ordered list of modifier group ids assigned to the product. Omitted groups are unassigned; the array index becomes the display order.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  modifierGroupIds!: string[];
}
