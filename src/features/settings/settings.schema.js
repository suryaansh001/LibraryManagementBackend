import { z } from 'zod';

export const settingsSchema = z.object({
  name: z.string().optional(),
  capacity: z.number().positive().optional(),
  defaultMonthlyFee: z.number().positive().optional(),
});

export const staffSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});
