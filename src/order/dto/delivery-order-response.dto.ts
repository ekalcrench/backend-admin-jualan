import { ApiProperty } from '@nestjs/swagger';

export class DeliveryOrderResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ minimum: 0 })
  deliveryFee!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  address!: string;

  @ApiProperty()
  phone!: string;

  @ApiProperty()
  latitude!: number;

  @ApiProperty()
  longitude!: number;
}
