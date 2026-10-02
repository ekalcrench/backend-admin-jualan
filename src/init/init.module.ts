import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { OrganizationRepository } from '../organization/organization.repository.js';
import { OrganizationUserRepository } from '../organization-user/organization-user.repository.js';
import { UserRepository } from '../user/user.repository.js';
import { UserService } from '../user/user.service.js';
import { InitController } from './init.controller.js';
import { InitService } from './init.service.js';

@Module({
  imports: [PrismaModule],
  controllers: [InitController],
  providers: [
    InitService,
    UserService,
    UserRepository,
    OrganizationRepository,
    OrganizationUserRepository,
  ],
})
export class InitModule {}
