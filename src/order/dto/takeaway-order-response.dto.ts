import { ApiProperty } from '@nestjs/swagger';
import { phoneExample } from '../../common/constants/api-value-example.constants.js';

export class TakeawayOrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true, example: phoneExample })
  phone!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  pickUpTime!: Date;
}
