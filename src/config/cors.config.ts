import { CorsOptions } from 'cors';
import { env } from './env.config.js';

const parseAllowedOrigins = (originsInput: string): string[] => {
  try {
    const parsed = JSON.parse(originsInput);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim());
    }
  } catch {
    // If not JSON array, parse comma-separated
    return originsInput.split(',').map((item) => item.trim());
  }
  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    `http://localhost:${env.PORT}`,
    `http://127.0.0.1:${env.PORT}`,
  ];
};

const allowedOrigins = parseAllowedOrigins(env.CORS_ORIGIN);
// Ensure backend self-origin is always allowed for interactive API documentation
if (!allowedOrigins.includes(`http://localhost:${env.PORT}`)) {
  allowedOrigins.push(`http://localhost:${env.PORT}`);
}
if (!allowedOrigins.includes(`http://127.0.0.1:${env.PORT}`)) {
  allowedOrigins.push(`http://127.0.0.1:${env.PORT}`);
}

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    return callback(new Error(`Origin '${origin}' not allowed by CORS policy`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Request-Id'],
  exposedHeaders: ['Content-Range', 'X-Content-Range', 'X-Request-Id'],
  maxAge: 86400, // 24 hours preflight cache
};
