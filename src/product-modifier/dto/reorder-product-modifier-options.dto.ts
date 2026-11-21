import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class ReorderProductModifierOptionsDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    uniqueItems: true,
    description:
      'Complete ordered list of every option id in the modifier group. The array index becomes the new sortOrder.',
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  optionIds!: string[];
}
