import { z } from 'zod';

const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_ANON_KEY: z.string().min(20).optional(),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  APP_URL: z.url().optional(),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export function loadConfig(env = process.env) {
  const parsed = Env.safeParse(env);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${msg}`);
  }
  const c = parsed.data;
  return {
    env: c.NODE_ENV,
    port: c.PORT,
    supabaseUrl: c.SUPABASE_URL,
    supabaseKey: c.SUPABASE_ANON_KEY,
    dbConfigured: Boolean(c.SUPABASE_URL && c.SUPABASE_ANON_KEY),
    corsOrigins: c.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean),
    logLevel: c.LOG_LEVEL,
    // Where password-reset emails send people back to (defaults to the first allowed origin).
    appUrl: (c.APP_URL || c.CORS_ORIGINS.split(',')[0] || '').trim().replace(/\/$/, ''),
  };
}
