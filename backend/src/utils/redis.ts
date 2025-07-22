import Redis, { Pipeline } from 'ioredis';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [REDIS-${level.toUpperCase()}]: ${message}`;
    })
  ),
  transports: [new winston.transports.Console()],
});

console.log(process.env.REDIS_URL, process.env.REDIS_HOST, process.env.REDIS_PORT, process.env.REDIS_PASSWORD);
// Redis connection configuration
const getRedisClient = () => {
  if (process.env.REDIS_URL) {
    logger.info(`Connecting to Redis using REDIS_URL: ${process.env.REDIS_URL}`);
    return new Redis(process.env.REDIS_URL);
  }
  logger.info(`Connecting to Redis using host: ${process.env.REDIS_HOST}, port: ${process.env.REDIS_PORT}`);
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
  });
};

// Create Redis client instance
class RedisClient {
  private client: Redis;
  private isConnected = false;
  constructor() {
    this.client = getRedisClient();
    this.setupEventHandlers();
    this.connect();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      logger.info('🔴 Redis: Connecting...');
    });
    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('✅ Redis: Connected and ready');
    });
    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error(`❌ Redis error: ${err.message}`);
    });
    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('⚠️  Redis: Connection closed');
    });
    this.client.on('reconnecting', () => {
      logger.info('🔄 Redis: Reconnecting...');
    });
    this.client.on('end', () => {
      logger.info('👋 Redis: Disconnected gracefully');
    });
  }

  private async connect() {
    try {
      await this.client.ping();
    } catch (error) {
      logger.error(`❌ Redis connection failed: ${error}`);
    }
  }

  // Basic Redis operations with error handling
  async get(key: string): Promise<string | null> {
    try {
      if (!this.isConnected) return null;
      const result = await this.client.get(key);
      return result;
    } catch (error) {
      logger.error(`❌ Redis GET error for key ${key}: ${error}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, value);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error(`❌ Redis SET error for key ${key}: ${error}`);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`❌ Redis DEL error for key ${key}: ${error}`);
      return false;
    }
  }

  async incr(key: string): Promise<number | null> {
    try {
      if (!this.isConnected) return null;
      const result = await this.client.incr(key);
      return result;
    } catch (error) {
      logger.error(`❌ Redis INCR error for key ${key}: ${error}`);
      return null;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.client.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error(`❌ Redis EXPIRE error for key ${key}: ${error}`);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Redis EXISTS error for key ${key}: ${error}`);
      return false;
    }
  }

  // List operations for event buffering
  async lpush(key: string, value: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.client.lpush(key, value);
      return true;
    } catch (error) {
      logger.error(`❌ Redis LPUSH error for key ${key}: ${error}`);
      return false;
    }
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      if (!this.isConnected) return [];
      const result = await this.client.lrange(key, start, stop);
      return result;
    } catch (error) {
      logger.error(`❌ Redis LRANGE error for key ${key}: ${error}`);
      return [];
    }
  }

  async ltrim(key: string, start: number, stop: number): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      await this.client.ltrim(key, start, stop);
      return true;
    } catch (error) {
      logger.error(`❌ Redis LTRIM error for key ${key}: ${error}`);
      return false;
    }
  }

  // Multi-operation for atomic updates
  multi(): any {
    return this.client.multi();
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error(`❌ Redis PING error: ${error}`);
      return false;
    }
  }

  // Get the raw client for advanced operations
  getClient(): Redis {
    return this.client;
  }

  // Graceful shutdown
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('👋 Redis: Disconnected gracefully');
    } catch (error) {
      logger.error(`❌ Redis disconnect error: ${error}`);
    }
  }

  // Check connection status
  isHealthy(): boolean {
    return this.isConnected;
  }
}

const redis = new RedisClient();
export default redis;
export { RedisClient }; 