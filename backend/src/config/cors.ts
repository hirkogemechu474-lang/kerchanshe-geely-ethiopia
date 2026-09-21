import cors from 'cors';
import { env } from './env';

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      env.cors.originWeb,
      env.cors.originAdmin,
      ...(env.nodeEnv !== 'production' ? [
        'http://localhost:7500',
        'http://localhost:7501',
        'http://localhost:4000',
      ] : []),
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (env.nodeEnv !== 'production') {
      callback(null, true); // Allow all in dev
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-middleware-check', 'x-payment-callback-secret'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
};
