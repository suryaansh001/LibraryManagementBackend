import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import { createLibrarySchema, updateLibrarySchema } from './admin.schema.js';
import * as adminController from './admin.controller.js';

export function setupAdminRoutes(app) {
  app.get('/api/admin/libraries', roleGuard('ADMIN'), adminController.listLibraries);
  app.post('/api/admin/libraries', roleGuard('ADMIN'), validate(createLibrarySchema), adminController.createLibrary);
  app.patch('/api/admin/libraries/:id', roleGuard('ADMIN'), validate(updateLibrarySchema), adminController.updateLibrary);
  app.patch('/api/admin/libraries/:id/status', roleGuard('ADMIN'), adminController.setLibraryStatus);
  app.patch('/api/admin/libraries/:id/subscription', roleGuard('ADMIN'), adminController.updateSubscription);
}
