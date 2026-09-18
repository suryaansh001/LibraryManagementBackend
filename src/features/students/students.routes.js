import { validate, validateQuery } from '../../middleware/validate.js';
import { createStudentSchema, updateStudentSchema, studentQuerySchema } from './students.schema.js';
import * as studentsController from './students.controller.js';
import { authMiddleware } from '../../middleware/auth.js';

export function setupStudentsRoutes(app) {
  app.get('/api/students', validateQuery(studentQuerySchema), studentsController.listStudents);
  app.post('/api/students', validate(createStudentSchema), studentsController.createStudent);
  app.get('/api/students/:id', studentsController.getStudent);
  app.patch('/api/students/:id', validate(updateStudentSchema), studentsController.updateStudent);
  app.patch('/api/students/:id/status', studentsController.updateStudentStatus);
  app.get('/api/students/:id/qr', studentsController.getStudentQr);
  app.get('/api/students/me', authMiddleware, studentsController.getMeStudent);
}
