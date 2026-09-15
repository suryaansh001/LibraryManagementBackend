import { ForbiddenError } from '../lib/errors.js';

export function roleGuard(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new ForbiddenError(`Requires ${role} role`));
    }
    next();
  };
}
