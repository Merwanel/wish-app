import { createClient, RedisClientOptions } from "redis";

export class OptionalRedis {
  private redisClient: ReturnType<typeof createClient> | null = null;

  async initialize({url, ...rest} : {url: string, [x:string]: any}) {
    try {
      this.redisClient = createClient({ url , ...rest}) ;
      this.redisClient.on('error', err => console.log('Redis Client Error', err));

      await this.redisClient .connect();
    }
    catch(err) {
      console.error("redis connection failed:", err)
    }
    return this ;
  }

  async set(key: string, value: string) {
    try {
      if(this.redisClient) {
        await this.redisClient.set(key, value) ;
      }
    }
    catch(err) {
      console.error("redis set failed :", err)
    }
  }
  async get(key: string) {
    try {
      if(this.redisClient) {
        return await this.redisClient.get(key) ;
      }
    }
    catch(err) {
      console.error("redis get failed :", err)
    }
    return null;
  }
}