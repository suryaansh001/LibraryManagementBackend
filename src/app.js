import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { setupAuthRoutes } from './features/auth/auth.routes.js';
import { setupStudentsRoutes } from './features/students/students.routes.js';
import { setupAttendanceRoutes } from './features/attendance/attendance.routes.js';
import { setupFeesRoutes } from './features/fees/fees.routes.js';
import { setupDashboardRoutes } from './features/dashboard/dashboard.routes.js';
import { setupSettingsRoutes } from './features/settings/settings.routes.js';
import { setupAdminRoutes } from './features/admin/admin.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { tenantScope } from './middleware/tenantScope.js';

const logger = pino({ level: (process.env.NODE_ENV || 'development') === 'development' ? 'warn' : 'info' });

export function createApp() {
  const app = express();

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
  });

  app.use(helmet());
  app.use(compression());
  app.use(pinoHttp({ logger }));
  app.use(express.json());

  app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });

  app.use(authMiddleware);
  app.use(tenantScope);

  setupAuthRoutes(app);
  setupStudentsRoutes(app);
  setupAttendanceRoutes(app);
  setupFeesRoutes(app);
  setupDashboardRoutes(app);
  setupSettingsRoutes(app);
  setupAdminRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
