import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './decorators/public.decorator.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT in Authorization header' })
  @ApiCreatedResponse({
    description: 'Returns user profile and sets Authorization header',
  })
  @ApiBadRequestResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    const { user, token } = await this.authService.login(dto);

    return { user, accessToken: token };
  }
}
