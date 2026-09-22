import { validate, validateQuery } from '../../middleware/validate.js';
import { feeQuerySchema, payFeeSchema, generateFeesSchema } from './fees.schema.js';
import * as feesController from './fees.controller.js';
import { roleGuard } from '../../middleware/roleGuard.js';

export function setupFeesRoutes(app) {
  app.get('/api/fees', roleGuard('OWNER'), validateQuery(feeQuerySchema), feesController.listFees);
  app.get('/api/fees/overdue', roleGuard('OWNER'), feesController.listOverdue);
  app.post('/api/fees/:id/pay', roleGuard('OWNER'), validate(payFeeSchema), feesController.payFee);
  app.post('/api/fees/generate', roleGuard('OWNER'), validate(generateFeesSchema), feesController.generateFees);
  app.get('/api/fees/student/:id', feesController.studentFees);
}
