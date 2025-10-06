import { createClient, RedisClientOptions } from "redis";

export class OptionalRedis {
  private redisClient: ReturnType<typeof createClient> | null = null;

  async initialize({ url, ...rest }: { url: string } & Omit<RedisClientOptions, 'url'>): Promise<OptionalRedis> {

    try {
      this.redisClient = createClient({
        url,
        ...rest,
        socket: {
          connectTimeout: 2000,
          reconnectStrategy: false,
          ...rest.socket
        }
      });

      this.redisClient.on('error', (err) => {
        console.log('⚠️ Redis error - url:', url, 'error:', err.message);
      });

      await this.redisClient.connect();
      console.log('✅ Redis connected successfully to', url);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.log('⚠️ Redis unavailable, continuing without cache. Error:', errorMsg);
      this.redisClient = null;
    }
    return this;
  }
  
  async set(key: string, value: string): Promise<void> {
    if (!this.redisClient) return;
    
    try {
      await this.redisClient.set(key, value);
    } catch (err) {
      console.warn('Redis set failed:', err instanceof Error ? err.message : String(err));
      this.redisClient = null;
    }
  }
  
  async get(key: string): Promise<string | null> {
    if (!this.redisClient) return null;
    
    try {
      return await this.redisClient.get(key);
    } catch (err) {
      console.warn('Redis get failed:', err instanceof Error ? err.message : String(err));
      this.redisClient = null;
      return null;
    }
  }
}