import { ApiProperty } from '@nestjs/swagger';
import {
  emailExample,
  personNameExample,
} from '../../common/constants/api-value-example.constants.js';

export class UserOptionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: personNameExample })
  name!: string;

  @ApiProperty({ format: 'email', example: emailExample })
  email!: string;
}
