import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Enforce UTC timezone globally across the entire Node.js runtime process
process.env.TZ = process.env.TZ || 'UTC';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  TZ: z.string().default('UTC'),
  PORT: z.coerce.number().default(4000),

  HOST: z.string().default('0.0.0.0'),
  APP_NAME: z.string().default('ad-e-com-backend'),
  API_PREFIX: z.string().default('/api/v1'),
  CLIENT_URL: z.string().default('http://localhost:3000'),

  // CORS - can be JSON array or comma separated
  CORS_ORIGIN: z.string().default('["http://localhost:3000","http://127.0.0.1:3000","http://localhost:5173"]'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 mins
  RATE_LIMIT_MAX: z.coerce.number().default(100),

  // Auth & JWT
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),

  // Database
  MONGO_URI: z.string().url().or(z.string().startsWith('mongodb://')).or(z.string().startsWith('mongodb+srv://')),
  MONGO_MAX_POOL_SIZE: z.coerce.number().default(50),
  MONGO_MIN_POOL_SIZE: z.coerce.number().default(10),
  MONGO_TIMEOUT_MS: z.coerce.number().default(10000),

  // Redis
  REDIS_ENABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional().default(''),
  REDIS_DB: z.coerce.number().default(0),
  REDIS_TTL_SECONDS: z.coerce.number().default(3600),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
export type EnvConfig = z.infer<typeof envSchema>;
