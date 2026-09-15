import { validate, validateQuery } from '../../middleware/validate.js';
import { feeQuerySchema, payFeeSchema, generateFeesSchema } from './fees.schema.js';
import * as feesController from './fees.controller.js';

export function setupFeesRoutes(app) {
  app.get('/api/fees', validateQuery(feeQuerySchema), feesController.listFees);
  app.get('/api/fees/overdue', feesController.listOverdue);
  app.post('/api/fees/:id/pay', validate(payFeeSchema), feesController.payFee);
  app.post('/api/fees/generate', validate(generateFeesSchema), feesController.generateFees);
  app.get('/api/fees/student/:id', feesController.studentFees);
}
