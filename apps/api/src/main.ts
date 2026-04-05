import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // CORS — allow Next.js frontend
  app.enableCors({
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  const port = 4500;
  await app.listen(port);
  console.log(`🚀 Javirs API running on http://localhost:${port}/api`);
}
bootstrap();
