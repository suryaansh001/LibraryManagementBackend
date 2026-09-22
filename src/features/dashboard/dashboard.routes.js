import { validate } from '../../middleware/validate.js';
import { dashboardSummary } from './dashboard.controller.js';
import { z } from 'zod';
import { roleGuard } from '../../middleware/roleGuard.js';

export function setupDashboardRoutes(app) {
  app.get('/api/dashboard/summary', roleGuard('OWNER'), dashboardSummary);
}
