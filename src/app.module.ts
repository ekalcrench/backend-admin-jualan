import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { UserModule } from './user/user.module.js';
import { OrganizationModule } from './organization/organization.module.js';

@Module({
  imports: [PrismaModule, UserModule, OrganizationModule],
})
export class AppModule {}
