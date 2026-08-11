import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { UserModule } from './user/user.module.js';

@Module({
  imports: [PrismaModule, UserModule],
})
export class AppModule {}
