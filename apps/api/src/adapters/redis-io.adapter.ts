import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      console.warn('[RedisAdapter] ⚠ REDIS_URL not set — using in-memory adapter (dev mode)');
      return;
    }

    try {
      const pubClient = new Redis(redisUrl, {
        maxRetriesPerRequest: null,  // required by ioredis for blocking commands
        enableReadyCheck: true,
        lazyConnect: false,
        retryStrategy: (times) => Math.min(times * 200, 5000), // backoff up to 5s
      });

      const subClient = pubClient.duplicate();

      await Promise.all([
        new Promise<void>((resolve, reject) => {
          pubClient.once('ready', resolve);
          pubClient.once('error', reject);
        }),
        new Promise<void>((resolve, reject) => {
          subClient.once('ready', resolve);
          subClient.once('error', reject);
        }),
      ]);

      pubClient.on('error', (err) => console.error('[Redis pub]', err.message));
      subClient.on('error', (err) => console.error('[Redis sub]', err.message));

      this.adapterConstructor = createAdapter(pubClient, subClient);
      console.log('[RedisAdapter] ✅ Redis adapter initialized');
    } catch (err) {
      console.error('[RedisAdapter] ✗ Failed to connect to Redis:', err);
      console.warn('[RedisAdapter] Falling back to in-memory adapter');
    }
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: '*', credentials: true },
      transports: ['websocket', 'polling'],
      // ── Server-side keep-alive ─────────────────────────────
      pingInterval: 25000,  // ping client every 25s
      pingTimeout: 20000,   // drop if no pong in 20s
      // ── Connection timeouts ────────────────────────────────
      connectTimeout: 30000,
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
