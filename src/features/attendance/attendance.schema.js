import { z } from 'zod';

export const scanSchema = z.object({
  qrToken: z.string().uuid('Invalid QR token format'),
});

export const manualSchema = z.object({
  studentId: z.string().uuid(),
  type: z.enum(['ENTRY', 'EXIT']),
});

export const attendanceQuerySchema = z.object({
  date: z.string().optional(),
  studentId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
