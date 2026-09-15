import { validate, validateQuery } from '../../middleware/validate.js';
import { scanSchema, manualSchema, attendanceQuerySchema } from './attendance.schema.js';
import * as attendanceController from './attendance.controller.js';

export function setupAttendanceRoutes(app) {
  app.post('/api/attendance/scan', validate(scanSchema), attendanceController.scanAttendance);
  app.post('/api/attendance/manual', validate(manualSchema), attendanceController.manualAttendance);
  app.get('/api/attendance', validateQuery(attendanceQuerySchema), attendanceController.listAttendance);
  app.get('/api/attendance/today', attendanceController.todayAttendance);
  app.get('/api/attendance/occupancy', attendanceController.occupancy);
}
