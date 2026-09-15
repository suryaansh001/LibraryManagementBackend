import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export function authMiddleware(req, res, next) { console.log('authMiddleware: cookie=', req.headers.cookie?.substring(0,30));
  const cookieHeader = req.headers.cookie || '';
  const tokenMatch = cookieHeader.match(/token=([^;]+)/);
  if (!tokenMatch) {
    req.user = null;
    return next();
  }

  const token = tokenMatch[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = { userId: decoded.userId, libraryId: decoded.libraryId, role: decoded.role };
    next();
  } catch (e) {
    req.user = null;
    next();
  }
}
