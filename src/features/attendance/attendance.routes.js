import { validate, validateQuery } from '../../middleware/validate.js';
import { scanSchema, manualSchema, attendanceQuerySchema } from './attendance.schema.js';
import * as attendanceController from './attendance.controller.js';
import { roleGuard } from '../../middleware/roleGuard.js';

export function setupAttendanceRoutes(app) {
  app.post('/api/attendance/scan', roleGuard('OWNER'), validate(scanSchema), attendanceController.scanAttendance);
  app.post('/api/attendance/manual', roleGuard('OWNER'), validate(manualSchema), attendanceController.manualAttendance);
  app.get('/api/attendance', roleGuard('OWNER'), validateQuery(attendanceQuerySchema), attendanceController.listAttendance);
  app.get('/api/attendance/today', roleGuard('OWNER'), attendanceController.todayAttendance);
  app.get('/api/attendance/occupancy', roleGuard('OWNER'), attendanceController.occupancy);
}
