import { ApiProperty } from '@nestjs/swagger';
import { DefaultPaginationResponseDto } from '../../common/dto/default-pagination-response.dto.js';
import { UserResponseDto } from './user-response.dto.js';

export class UserGetByPagesResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  items!: UserResponseDto[];

  @ApiProperty({ type: DefaultPaginationResponseDto })
  pagination!: DefaultPaginationResponseDto;
}
