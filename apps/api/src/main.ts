import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/redis-io.adapter';

async function bootstrap() {
  // ── Fail fast on missing critical environment variables ────────────────────
  const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}\n`);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });

  // ── Redis-backed Socket.IO adapter ──────────────────────────────────────────
  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connectToRedis();
  app.useWebSocketAdapter(redisAdapter);

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global validation ───────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ── Global HTTP prefix ──────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 Onyx API running → http://localhost:${port}/api`);
  console.log(`🔌 Socket.IO listening on ws://localhost:${port}\n`);
}

bootstrap();
