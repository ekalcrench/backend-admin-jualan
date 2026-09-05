import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRepository } from '../user/user.repository.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserStatus } from '../common/enum/user-status.enum.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { EmailService } from '../email/email.service.js';
import { UserService } from '../user/user.service.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { UserResponseDto } from '../user/dto/user-response.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly userService: UserService,
  ) {}

  private toResponse(user: any): UserResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;
    return safeUser;
  }

  private async validateUserPassword(userPassword: string, password: string) {
    const isValid = await argon2.verify(userPassword, password);

    return isValid;
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundException('Email belum terdaftar');
    }

    const isValid = await this.validateUserPassword(
      user.password,
      dto.password,
    );

    if (!isValid) {
      throw new UnauthorizedException('Password tidak valid');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      name: user.email,
    });

    return { user, token };
  }

  async register(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      if (existingUser.status === UserStatus.PENDING_EMAIL.toString()) {
        await this.resendOtp({ email: dto.email });

        return this.toResponse(existingUser);
      }

      throw new ConflictException('Email sudah terdaftar');
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.userRepository.create({
      ...dto,
      password: hashedPassword,
      status: UserStatus.PENDING_EMAIL,
    });

    await this.emailService.createEmailVerification({
      userId: user.id,
      email: user.email,
    });

    return this.toResponse(user);
  }

  async verifyRegistrationCheck(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('Email belum terdaftar');
    }

    if (user.status !== UserStatus.PENDING_EMAIL) {
      throw new BadRequestException('Email sudah terdaftar');
    }

    const otpValidResendTime = await this.emailService.getNewOtpValidResendTime(
      user.id,
    );

    return { user: this.toResponse(user), otpValidResendTime };
  }

  async verifyRegistration(dto: VerifyEmailDto) {
    const { user } = await this.verifyRegistrationCheck(dto.email);

    await this.emailService.verifyRegistrationCode(user.id, dto.code);

    const latestUser = await this.userRepository.update(user.id, {
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    });

    return this.toResponse(latestUser);
  }

  async resendOtp(dto: ResendOtpDto) {
    const { user, otpValidResendTime } = await this.verifyRegistrationCheck(
      dto.email,
    );

    const canResend = Date.now() >= otpValidResendTime.getTime();

    if (!canResend) {
      throw new BadRequestException('Resend OTP is not allowed yet');
    }

    await this.emailService.resendOtp({ email: user.email, userId: user.id });

    return { user, otpValidResendTime };
  }
}
