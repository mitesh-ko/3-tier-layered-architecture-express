import pino from 'pino';
import { env } from './env.config.js';

export const logger = pino({
  level: env.LOG_LEVEL,
  // Security: Redact sensitive information to prevent credential leaks in logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.confirmPassword',
      'password',
      'confirmPassword',
      'token',
      'accessToken',
      'refreshToken',
      '*.password',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  transport:
    env.NODE_ENV === 'development'
      ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
      : undefined,
  base: {
    service: env.APP_NAME,
    env: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
