import { validate, validateQuery } from '../../middleware/validate.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { settingsSchema, staffSchema } from './settings.schema.js';
import * as settingsController from './settings.controller.js';

export function setupSettingsRoutes(app) {
  app.get('/api/settings', settingsController.getSettings);
  app.patch('/api/settings', validate(settingsSchema), roleGuard('OWNER'), settingsController.updateSettings);
  app.get('/api/settings/staff', roleGuard('OWNER'), settingsController.listStaff);
  app.post('/api/settings/staff', validate(staffSchema), roleGuard('OWNER'), settingsController.createStaff);
  app.delete('/api/settings/staff/:id', roleGuard('OWNER'), settingsController.deleteStaff);
}
