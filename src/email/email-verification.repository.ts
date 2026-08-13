import { Prisma } from '../../prisma/generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailVerificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  findLatestByUserId(userId: string) {
    return this.prisma.emailVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(data: Prisma.EmailVerificationUncheckedCreateInput) {
    return this.prisma.emailVerification.create({
      data: {
        otpHash: data.otpHash,
        expiresAt: data.expiresAt,
        attempts: data.attempts,
        user: {
          connect: { id: data.userId },
        },
      },
    });
  }

  incrementAttempts(id: string) {
    return this.prisma.emailVerification.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }
}
