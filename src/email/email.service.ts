import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { EmailVerificationRepository } from './email-verification.repository.js';
import { CreateEmailVerificationDto } from './dto/create-email-verification.dto.js';
import { randomInt } from 'crypto';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  constructor(
    private readonly emailVerificationRepository: EmailVerificationRepository,
    private readonly resend: Resend,
  ) {}

  private generateOtpCode() {
    return randomInt(100000, 1000000).toString();
  }

  private getEmailSender() {
    const from = process.env.RESEND_FROM_EMAIL ?? process.env.RESEND_FROM;
    if (!from) {
      throw new InternalServerErrorException(
        'RESEND_FROM_EMAIL environment variable is required',
      );
    }
    return from;
  }

  private async sendOtpCodeToEmail(email: string, otpCode: string) {
    await this.resend.emails.send({
      from: this.getEmailSender(),
      to: email,
      subject: 'Verify your email address',
      html: `
          <p>Thank you for registering.</p>
          <p>Your OTP code is: <strong>${otpCode}</strong></p>
          <p>The code expires in 10 minutes.</p>
        `,
    });
  }

  async createEmailVerification(dto: CreateEmailVerificationDto) {
    const otpCode = this.generateOtpCode();
    const otpHash = await argon2.hash(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 Menit

    await this.sendOtpCodeToEmail(dto.email, otpCode);

    const emailVerification = await this.emailVerificationRepository.create({
      expiresAt,
      otpHash,
      userId: dto.userId,
      attempts: 0,
      lastSentAt: new Date(),
    });

    return emailVerification;
  }

  async resendOtp(dto: CreateEmailVerificationDto) {
    const otpCode = this.generateOtpCode();
    const otpHash = await argon2.hash(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 Menit

    await this.sendOtpCodeToEmail(dto.email, otpCode);

    const emailVerification = await this.emailVerificationRepository.update({
      expiresAt,
      otpHash,
      userId: dto.userId,
      attempts: 0,
      lastSentAt: new Date(Date.now()),
    });

    return emailVerification;
  }

  async verifyRegistrationCode(userId: string, code: string) {
    const verification =
      await this.emailVerificationRepository.findLatestByUserId(userId);

    if (!verification) {
      throw new BadRequestException('No verification code found for this user');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('OTP Code has expired');
    }

    // Maksimum attempts = 5
    if (verification.attempts > 5) {
      throw new BadRequestException('Too many invalid attempts');
    }

    const isValidCode = await argon2.verify(verification.otpHash, code);

    if (!isValidCode) {
      await this.emailVerificationRepository.incrementAttempts(verification.id);

      throw new BadRequestException('Invalid OTP Code');
    }
  }
}
