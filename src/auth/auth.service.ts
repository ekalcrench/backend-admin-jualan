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

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  private toResponse(user: any) {
    const { password, ...safeUser } = user;
    return safeUser;
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) return null;

    const isValid = await argon2.verify(user.password, password);

    if (!isValid) return null;

    return this.toResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      name: user.email,
    });

    return { user, token };
  }

  async create(dto: CreateUserDto) {
    const existingUser = await this.userRepository.findByEmail(dto.email);

    if (existingUser) {
      if (existingUser.status === UserStatus.PENDING_EMAIL.toString()) {
        await this.emailService.createEmailVerification({
          userId: existingUser.id,
          email: existingUser.email,
        });

        return this.toResponse(existingUser);
      }

      throw new ConflictException('User already exists');
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

  async verifyRegistration(dto: VerifyEmailDto) {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.status !== UserStatus.PENDING_EMAIL.toString()) {
      throw new BadRequestException('Email verification is not allowed');
    }

    await this.emailService.verifyRegistrationCode(user.id, dto.code);

    const latestUser = await this.userRepository.update(user.id, {
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    });

    return this.toResponse(latestUser);
  }
}
