import { z } from 'zod';

export const createLibrarySchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().max(250).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal('')),
  capacity: z.number().int().positive().max(100000).optional(),
  defaultMonthlyFee: z.number().nonnegative().optional(),
  ownerName: z.string().min(1).max(100),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
  trialDays: z.number().int().min(0).max(365).default(14),
});

export const updateLibrarySchema = createLibrarySchema.partial().omit({ ownerName: true, ownerEmail: true, ownerPassword: true, trialDays: true });
