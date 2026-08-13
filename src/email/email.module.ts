import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EmailService } from './email.service.js';
import { EmailVerificationRepository } from './email-verification.repository.js';
import { Resend } from 'resend';
import 'dotenv/config';

@Module({
  imports: [PrismaModule],
  providers: [
    EmailService,
    EmailVerificationRepository,
    {
      provide: Resend,
      useFactory: () => {
        return new Resend(process.env.RESEND_API_KEY);
      },
    },
  ],
  exports: [EmailService, EmailVerificationRepository],
})
export class EmailModule {}
