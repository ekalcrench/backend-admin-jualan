import { BaseResponseDto } from '../../common/dto/base-response.dto.js';

export class CreateUserDto extends BaseResponseDto {
  email!: string;
  password!: string;
  name!: string;
}
