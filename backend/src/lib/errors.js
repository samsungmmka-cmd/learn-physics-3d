export class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

export const badRequest = (message) => new HttpError(400, 'invalid', message);
export const unauthorized = (message = 'Sign in first') => new HttpError(401, 'unauthorized', message);
export const forbidden = (message = 'You do not have permission to do that') => new HttpError(403, 'forbidden', message);
export const notFound = (message = 'Not found') => new HttpError(404, 'not_found', message);

// Map a PostgREST / Postgres error to an HTTP error without leaking internals.
export function fromDb(err) {
  const msg = err?.message || '';
  if (err?.code === '42501' || /row-level security|permission denied/i.test(msg)) return forbidden();
  if (err?.code === '23505') return new HttpError(409, 'conflict', 'Already exists');
  if (err?.code === '23503') return badRequest('Referenced item does not exist');
  if (['23514', '22P02', '22023', '22007', '22008'].includes(err?.code)) return badRequest('Invalid value');
  if (err?.code === 'PGRST116') return notFound();
  const e = new HttpError(500, 'server_error', 'Something went wrong');
  e.cause = err;
  return e;
}

// Unwrap a supabase-js { data, error } result.
export function must({ data, error }) {
  if (error) throw fromDb(error);
  return data;
}
