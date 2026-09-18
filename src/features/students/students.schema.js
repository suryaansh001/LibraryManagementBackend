import { z } from 'zod';

export const createStudentSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional(),
  monthlyFeeOverride: z.number().positive().optional(),
  seatNumber: z.string().optional(),
  isGuest: z.boolean().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().optional(),
  gender: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateStudentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  monthlyFeeOverride: z.number().positive().optional(),
  seatNumber: z.string().optional(),
  address: z.string().optional(),
  gender: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const studentQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
