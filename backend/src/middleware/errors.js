import { HttpError } from '../lib/errors.js';

export const notFoundHandler = (_req, _res, next) => next(new HttpError(404, 'not_found', 'No such endpoint'));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  let e = err;
  if (err?.type === 'entity.parse.failed') e = new HttpError(400, 'invalid', 'Body must be valid JSON');
  else if (err?.type === 'entity.too.large') e = new HttpError(413, 'too_large', 'Request body is too large');
  else if (!(err instanceof HttpError)) e = new HttpError(500, 'server_error', 'Something went wrong');
  if (e.status >= 500) req.log?.error({ err: err.cause || err }, 'request failed');
  res.status(e.status).json({ error: e.code, message: e.message });
};
