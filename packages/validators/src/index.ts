import { z } from 'zod';

// ── Chat Validators ──────────────────────

// Reader context — sent when chatting from within the Textbook Reader
const readerContextSchema = z.object({
  bookVolumeId: z.string().optional(),
  topicId: z.string().optional(),
  pageNumber: z.number().int().positive().optional(),
  chapterName: z.string().optional(),
  topicName: z.string().optional(),
}).optional();

export const sendMessageSchema = z.object({
  content: z
    .string()
    .max(4000, 'Message too long (max 4000 characters)')
    .optional(),
  hintLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  imageUrl: z.string().nullable().optional(),
  imageBase64: z.string().nullable().optional(),
  imageMimeType: z.string().nullable().optional(),
  // Reader context: topic/page being viewed when message is sent
  readerContext: readerContextSchema,
}).refine(data => (data.content && data.content.trim().length > 0) || data.imageUrl || data.imageBase64, {
  message: "Either message text or an image is required"
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
