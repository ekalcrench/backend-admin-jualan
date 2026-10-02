import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { PrismaModule } from './prisma/prisma.module.js';
import { UserModule } from './user/user.module.js';
import { OrganizationModule } from './organization/organization.module.js';
import { AuthModule } from './auth/auth.module.js';
import { OrganizationUserModule } from './organization-user/organization-user.module.js';
import { InventoryItemModule } from './inventory-item/inventory-item.module.js';
import { PurchaseModule } from './purchase/purchase.module.js';
import { InitModule } from './init/init.module.js';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    OrganizationModule,
    OrganizationUserModule,
    InventoryItemModule,
    PurchaseModule,
    AuthModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ...(process.env.NODE_ENV === 'development' ? [InitModule] : []),
  ],
})
export class AppModule {}
