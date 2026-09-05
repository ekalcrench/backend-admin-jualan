import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
