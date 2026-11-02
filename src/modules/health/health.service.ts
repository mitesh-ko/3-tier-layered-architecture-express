import { Database } from '#config/database.config.js';
import { RedisManager } from '#config/redis.config.js';
import { env } from '#config/env.config.js';
import { DateUtil } from '#shared/utils/date.util.js';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  version: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down' | 'disabled';
  };
  system: {
    memoryUsageMB: number;
    nodeVersion: string;
  };
}

export class HealthService {
  public static async getHealth(): Promise<HealthStatus> {
    const isDbHealthy = await Database.isHealthy();
    const isRedisHealthy = await RedisManager.isHealthy();

    const memUsage = process.memoryUsage();
    const memoryUsageMB = Math.round((memUsage.rss / 1024 / 1024) * 100) / 100;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (!isDbHealthy) {
      overallStatus = 'unhealthy';
    } else if (env.REDIS_ENABLED && !isRedisHealthy) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      uptime: Math.floor(process.uptime()),
      timestamp: DateUtil.toUTCISOString(),
      version: '1.0.0',
      services: {
        database: isDbHealthy ? 'up' : 'down',
        redis: !env.REDIS_ENABLED ? 'disabled' : isRedisHealthy ? 'up' : 'down',
      },
      system: {
        memoryUsageMB,
        nodeVersion: process.version,
      },
    };
  }
}
