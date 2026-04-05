import { z } from 'zod';

// ── Chat Validators ──────────────────────

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(4000, 'Message too long (max 4000 characters)'),
  hintLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

export const createSessionSchema = z.object({
  subjectId: z.string().cuid().optional(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;

// ── User Validators ──────────────────────

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100),
  name: z.string().min(2).max(100),
  role: z.enum(['STUDENT', 'PARENT']).default('STUDENT'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
