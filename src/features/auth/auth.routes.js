import { validate } from '../../middleware/validate.js';
import { loginSchema } from './auth.schema.js';
import * as authController from './auth.controller.js';
import { authMiddleware, requireAuth } from '../../middleware/auth.js';

export function setupAuthRoutes(app) {
  app.post('/api/auth/login', validate(loginSchema), authController.loginController);
  app.post('/api/auth/logout', authController.logoutController);
  app.get('/api/auth/me', authMiddleware, requireAuth, authController.meController);
}
