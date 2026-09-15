import { z } from 'zod';

export const feeQuerySchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PARTIAL', 'OVERDUE']).optional(),
  studentId: z.string().optional(),
  month: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export const payFeeSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'OTHER']).optional(),
});

export const generateFeesSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM format'),
});
