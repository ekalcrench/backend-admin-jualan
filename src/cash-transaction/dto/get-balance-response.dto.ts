import { ApiProperty } from '@nestjs/swagger';

export class GetBalanceResponseDto {
  @ApiProperty({ minimum: 0 })
  balance!: number;
}
