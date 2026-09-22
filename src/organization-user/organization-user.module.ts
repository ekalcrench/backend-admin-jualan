import { Module } from '@nestjs/common';
import { OrganizationUserService } from './organization-user.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrganizationUserController } from './organization-user.controller.js';
import { OrganizationUserRepository } from './organization-user.repository.js';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationUserController],
  providers: [OrganizationUserService, OrganizationUserRepository],
  // exports: [UserRepository],
})
export class OrganizationUserModule {}
