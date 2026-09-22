import { Module } from '@nestjs/common';
import { UserService } from './organization-users.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrganizationUserController } from './organization-users.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationUserController],
  providers: [UserService, OrganizationUserController],
  // exports: [UserRepository],
})
export class UserModule {}
