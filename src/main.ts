import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { MAX_LOGO_BASE64_SIZE } from './common/constants/organization.constants.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
  });

  app.use(json({ limit: MAX_LOGO_BASE64_SIZE + 64 * 1024 }));
  app.use(urlencoded({ extended: true, limit: 100 * 1024 }));

  app.setGlobalPrefix('api', {
    exclude: ['uploads/(.*)'],
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('Backend Admin Jualan API')
    .setDescription('CRUD API for managing users')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  document.security = [
    {
      bearer: [],
    },
  ];

  SwaggerModule.setup('api', app, document);

  await app.listen(Number(process.env.PORT ?? 8080), '0.0.0.0');
}

void bootstrap();
