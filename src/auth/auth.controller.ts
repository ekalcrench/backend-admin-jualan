import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './decorators/public.decorator.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { CreateUserResponseDto } from './dto/create-user-response.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LoginResponseDto } from './dto/login-response.dto.js';
import { ResendOtpResponseDto } from './dto/resend-otp-response.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Login and receive access token' })
  @ApiOkResponse({
    description: 'Returns user profile and access token',
    type: LoginResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Email belum terdaftar' })
  @ApiUnauthorizedResponse({ description: 'Password tidak valid' })
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
  @ApiConflictResponse({ description: 'Email sudah terdaftar' })
  async register(@Body() dto: CreateUserDto) {
    const user = await this.authService.register(dto);

    return user;
  }

  @Public()
  @Get('register/verify')
  @ApiOperation({ summary: 'Get if email is verified for verification' })
  @ApiOkResponse({
    description: 'Returns user profile',
    type: ResendOtpResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Email sudah terdaftar' })
  @ApiNotFoundResponse({ description: 'Email belum terdaftar' })
  async registerVerifyCheck(@Query('email') email: string) {
    return this.authService.verifyRegistrationCheck(email);
  }

  @Public()
  @Put('register/verify')
  @ApiOperation({ summary: 'Verify registration OTP code' })
  @ApiOkResponse({
    description: 'Returns user profile',
    type: CreateUserResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Email verification is not allowed or invalid OTP code',
  })
  @ApiNotFoundResponse({ description: 'User not found' })
  async registerVerify(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyRegistration(dto);
  }

  @Public()
  @Post('resend-otp')
  @ApiOperation({ summary: 'Resend OTP Code' })
  @ApiCreatedResponse({
    description: 'Return resend OTP response',
    type: ResendOtpResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Resend OTP is not allowed yet' })
  async resendOtp(@Body() dto: ResendOtpDto) {
    const response = await this.authService.resendOtp(dto);

    return response;
  }
}
