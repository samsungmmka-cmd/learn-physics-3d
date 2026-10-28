import { badRequest } from '../lib/errors.js';

// validate({ body, query, params }) parses each part with its zod schema and stores the result on req.valid.
export const validate = (schemas) => (req, _res, next) => {
  req.valid = req.valid || {};
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const r = schemas[part].safeParse(req[part] ?? {});
    if (!r.success) {
      const i = r.error.issues[0];
      const field = i.path.join('.');
      return next(badRequest(field ? `${field}: ${i.message}` : i.message));
    }
    req.valid[part] = r.data;
  }
  return next();
};
