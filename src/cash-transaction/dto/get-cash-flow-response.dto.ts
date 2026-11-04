import { ApiProperty } from '@nestjs/swagger';

export class GetCashFlowResponseDto {
  @ApiProperty({ minimum: 0 })
  cashIn!: number;

  @ApiProperty({ minimum: 0 })
  cashOut!: number;

  @ApiProperty({ minimum: 0 })
  prevCashIn!: number;

  @ApiProperty({ minimum: 0 })
  prevCashOut!: number;
}
