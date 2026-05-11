import { Redis } from "ioredis";

export class CacheService {
  private static cache = new Map<string, { value: any; expiry: number }>();
  private static redis: Redis | null = null;

  static init() {
    // Se quiser usar Redis futuramente, configure aqui
    // this.redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
  }

  static async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    }

    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  static async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
      return;
    }

    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiry });
  }

  static async del(key: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(key);
      return;
    }
    this.cache.delete(key);
  }
}
