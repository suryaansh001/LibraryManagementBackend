import { validate } from '../../middleware/validate.js';
import { dashboardSummary } from './dashboard.controller.js';
import { z } from 'zod';

export function setupDashboardRoutes(app) {
  app.get('/api/dashboard/summary', dashboardSummary);
}
