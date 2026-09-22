import { validate, validateQuery } from '../../middleware/validate.js';
import { createStudentSchema, updateStudentSchema, studentQuerySchema } from './students.schema.js';
import * as studentsController from './students.controller.js';
import { authMiddleware } from '../../middleware/auth.js';
import { roleGuard } from '../../middleware/roleGuard.js';

export function setupStudentsRoutes(app) {
  app.get('/api/students', roleGuard('OWNER'), validateQuery(studentQuerySchema), studentsController.listStudents);
  app.post('/api/students', roleGuard('OWNER'), validate(createStudentSchema), studentsController.createStudent);
  app.get('/api/students/:id', roleGuard('OWNER'), studentsController.getStudent);
  app.patch('/api/students/:id', roleGuard('OWNER'), validate(updateStudentSchema), studentsController.updateStudent);
  app.patch('/api/students/:id/status', roleGuard('OWNER'), studentsController.updateStudentStatus);
  app.get('/api/students/:id/qr', studentsController.getStudentQr);
  app.get('/api/students/me', authMiddleware, studentsController.getMeStudent);
}
