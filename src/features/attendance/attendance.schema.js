import { z } from 'zod';

export const scanSchema = z.object({
  qrToken: z.string().min(1, 'QR token is required'),
});

export const manualSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  type: z.enum(['ENTRY', 'EXIT']),
});

export const attendanceQuerySchema = z.object({
  date: z.string().optional(),
  studentId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
