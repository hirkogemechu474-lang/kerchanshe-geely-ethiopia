import express, { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { routes } from './routes';
import { UPLOAD_ROOT } from './routes/upload.routes';

const app = express();

// Behind Apache's reverse proxy (loopback only), so req.secure needs the
// X-Forwarded-Proto header it sets — without this, req.secure is always
// false and every auth cookie silently loses its Secure/__Secure- prefix.
app.set('trust proxy', 1);

// ── Security & Parsing ─────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(corsOptions));
// The pnpm workspace hoists two conflicting @types/express-serve-static-core
// versions (v4 for this package's own dependency, v5 pulled in by
// @types/compression's "@types/express": "*" range elsewhere in the
// monorepo), so compression()'s inferred RequestHandler type structurally
// disagrees with this Express 4 app's — a duplicate-types artifact, not a
// real runtime incompatibility (compression's actual export is a plain
// Express middleware function). Assert the correct type to work around it.
app.use(compression() as unknown as RequestHandler);
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Health Check ────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ──────────────────────────────────────────────────────────
app.use('/api', routes);

// ── Static Files (uploads) ─────────────────────────────────────────────
app.use('/uploads', express.static(UPLOAD_ROOT));

// ── Error Handling ──────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
