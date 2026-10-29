import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import { pino } from 'pino';
import { HttpError } from './lib/errors.js';
import { createDb } from './lib/db.js';
import { requireUser } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import authRoutes from './routes/auth.js';
import assignmentRoutes from './routes/assignments.js';
import communityRoutes from './routes/community.js';

export function createApp(config, { db = config.dbConfigured ? createDb(config) : null, logger } = {}) {
  const app = express();
  const log = logger || pino({ level: config.env === 'test' ? 'silent' : config.logLevel, redact: ['req.headers.authorization', 'req.headers.cookie'] });

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Vercel / a load balancer: rate limits use the real client IP
  app.use(pinoHttp({ logger: log, autoLogging: { ignore: (req) => req.url === '/api/health' } }));
  // JSON API called from the frontend's own domain: allow cross-origin reads (CORS still decides who may call).
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({
    origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 600,
  }));
  app.use(express.json({ limit: '32kb' }));
  app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

  const api = express.Router();
  api.get('/health', (_req, res) => res.json({ ok: true, service: 'learn-physics-api', configured: !!db }));

  // Everything below needs the database.
  api.use((_req, _res, next) => next(db ? undefined : new HttpError(503, 'not_configured', 'The database is not connected yet')));
  api.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: 'draft-8', legacyHeaders: false }));
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'rate_limited', message: 'Too many attempts. Try again in a few minutes.' },
  });

  if (db) {
    api.use('/auth', authLimiter, authRoutes(db, { appUrl: config.appUrl }));
    const signedIn = requireUser(db);
    api.use('/assignments', signedIn, assignmentRoutes());
    api.use(['/posts', '/results', '/progress', '/comments'], signedIn);
    api.use(communityRoutes());
  }

  app.use('/api', api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
