import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './decorators/public.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { CreateUserResponseDto } from './dto/create-user-response.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';

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

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register to admin dashboard' })
  @ApiCreatedResponse({
    description: 'Returns user profile',
    type: CreateUserResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  @ApiConflictResponse({ description: 'User with this email already exists' })
  async register(@Body() dto: CreateUserDto) {
    const user = await this.authService.create(dto);

    return user;
  }

  @Public()
  @Post('register/verify')
  @ApiOperation({ summary: 'Verify registration OTP code' })
  @ApiOkResponse({ description: 'Returns the verified user profile' })
  @ApiBadRequestResponse({
    description: 'Invalid request payload or expired code',
  })
  @ApiUnauthorizedResponse({ description: 'Invalid verification code' })
  async registerVerify(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyRegistration(dto);
  }
}
