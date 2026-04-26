import { z } from 'zod';

// ── Chat Validators ──────────────────────

// Reader context — sent when chatting from within the Textbook Reader
const readerContextSchema = z.object({
  bookVolumeId: z.string().nullable().optional(),
  topicId: z.string().nullable().optional(),
  pageNumber: z.number().int().positive().nullable().optional(),
  chapterName: z.string().nullable().optional(),
  topicName: z.string().nullable().optional(),
}).optional();

export const sendMessageSchema = z.object({
  content: z
    .string()
    .max(4000, 'Message too long (max 4000 characters)')
    .optional(),
  hintLevel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  imageUrl: z.string().url().nullable().optional(),    // R2 signed URL (preferred)
  imageBase64: z.string().nullable().optional(),       // base64 fallback (inline)
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

// Login accepts either an email or a username. We don't enforce email format
// because students may not have an email and use a username instead.
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Bắt buộc nhập email hoặc tên đăng nhập').max(255),
  password: z.string().min(1),
});

// Username rules — lowercase ASCII to keep things easy for kids to type and
// avoid case-sensitivity surprises. 3–32 chars, [a-z0-9_-].
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Tên đăng nhập tối thiểu 3 ký tự')
  .max(32, 'Tên đăng nhập tối đa 32 ký tự')
  .regex(/^[a-z0-9_-]+$/, 'Chỉ dùng chữ thường, số, gạch dưới, gạch ngang');

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

// ── Admin User Management ────────────────

const userRoleEnum = z.enum(['STUDENT', 'ADMIN', 'PARENT']);

export const adminCreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2).max(100),
  role: userRoleEnum.default('STUDENT'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100),
});

export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: userRoleEnum.optional(),
});

export const adminListUsersQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  role: userRoleEnum.optional(),
  status: z.enum(['active', 'banned', 'all']).default('all'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(['name', 'email', 'role', 'createdAt']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const adminBulkUserIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

export const adminResetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .optional(),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminListUsersQuery = z.infer<typeof adminListUsersQuerySchema>;
export type AdminBulkUserIds = z.infer<typeof adminBulkUserIdsSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;

// ── Admin Chat Session Management ────────

const chatModeEnum = z.enum(['SUBJECT', 'OPEN']);

export const adminListSessionsQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  mode: chatModeEnum.optional(),
  subjectId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  hasMessages: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(['updatedAt', 'createdAt']).default('updatedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export const adminBulkSessionIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});

export type AdminListSessionsQuery = z.infer<typeof adminListSessionsQuerySchema>;
export type AdminBulkSessionIds = z.infer<typeof adminBulkSessionIdsSchema>;

// ── Slide Deck Validators ────────────────

// Length / count constraints are intentionally NOT expressed in the Zod schema:
// Gemini's structured-output engine rejects schemas with too many bounded
// constraints ("too many states for serving"). The prompt enforces lengths;
// the renderer is defensive against overlong text.
const slideBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('title'),
    text: z.string(),
    emphasis: z.enum(['primary', 'accent', 'muted']).optional(),
  }),
  z.object({
    type: z.literal('subtitle'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('body'),
    text: z.string(),
    size: z.enum(['sm', 'md', 'lg']).optional(),
  }),
  z.object({
    type: z.literal('bullets'),
    items: z.array(z.string()),
    style: z.enum(['dot', 'check', 'arrow', 'number']).optional(),
  }),
  z.object({
    type: z.literal('list'),
    items: z.array(z.string()),
    style: z.enum(['dot', 'check', 'arrow', 'number']).optional(),
  }),
  z.object({
    type: z.literal('quote'),
    text: z.string(),
    cite: z.string().optional(),
  }),
  z.object({
    type: z.literal('formula'),
    latex: z.string(),
    caption: z.string().optional(),
  }),
  z.object({
    type: z.literal('icon'),
    name: z.string(),
    color: z.enum(['primary', 'accent', 'success', 'warning', 'danger', 'muted']).optional(),
  }),
  z.object({
    type: z.literal('comparison'),
    left: z.object({
      label: z.string(),
      items: z.array(z.string()),
    }),
    right: z.object({
      label: z.string(),
      items: z.array(z.string()),
    }),
  }),
  z.object({
    type: z.literal('timeline'),
    steps: z.array(
      z.object({
        label: z.string(),
        desc: z.string().optional(),
        icon: z.string().optional(),
      }),
    ),
  }),
  z.object({
    type: z.literal('mnemonic'),
    letters: z.array(
      z.object({
        char: z.string(),
        word: z.string(),
      }),
    ),
  }),
]);

const slideSchema = z.object({
  layout: z.enum([
    'title-cover',
    'centered',
    'two-column',
    'timeline',
    'comparison',
    'quote',
    'mnemonic',
    'bullets',
  ]),
  background: z
    .enum(['plain', 'gradient-primary', 'gradient-accent', 'pattern-grid'])
    .optional(),
  blocks: z.array(slideBlockSchema),
  speakerNotes: z.string().optional(),
});

export const slideDeckSchema = z.object({
  title: z.string(),
  language: z.enum(['vi', 'en', 'mix']),
  slides: z.array(slideSchema),
});

export const summarizeSlidesSchema = z.object({
  bookId: z.string().cuid(),
  pageStart: z.number().int().positive().optional(),
  pageEnd: z.number().int().positive().optional(),
  topicId: z.string().cuid().optional(),
  depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
  language: z.enum(['vi', 'en', 'mix']).optional(),
}).refine(
  (data) => data.topicId || (data.pageStart && data.pageEnd),
  { message: 'Either topicId or pageStart+pageEnd is required' },
);

export type SlideBlock = z.infer<typeof slideBlockSchema>;
export type Slide = z.infer<typeof slideSchema>;
export type SlideDeck = z.infer<typeof slideDeckSchema>;
export type SummarizeSlidesInput = z.infer<typeof summarizeSlidesSchema>;

// ── Parent ↔ Child Linking ───────────────

const curriculumEnum = z.enum(['IGCSE', 'A_LEVEL', 'THPT_VN', 'IB', 'AP']);

// Parent creates a child account. Children typically don't have email — we
// use a username as the primary login. Email is optional (can be added later).
export const parentCreateChildSchema = z.object({
  username: usernameSchema,
  name: z.string().trim().min(2).max(100),
  password: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự').max(100),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('').transform(() => undefined)),
  curriculum: curriculumEnum.optional(),
});

// Invite an existing account by email or username. Service resolves the
// identifier to a user before issuing the code.
export const parentInviteChildSchema = z.object({
  childIdentifier: z.string().trim().min(3, 'Bắt buộc nhập email hoặc tên đăng nhập của con').max(255),
});

export const redeemParentLinkSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Mã liên kết phải gồm 6 chữ số'),
});

export type ParentCreateChildInput = z.infer<typeof parentCreateChildSchema>;
export type ParentInviteChildInput = z.infer<typeof parentInviteChildSchema>;
export type RedeemParentLinkInput = z.infer<typeof redeemParentLinkSchema>;

// ── Reader Bookmarks & Notes ─────────────

export const createBookmarkSchema = z.object({
  bookVolumeId: z.string().cuid(),
  pageNumber: z.number().int().positive(),
  label: z.string().max(120).optional(),
});

export const upsertNoteSchema = z.object({
  bookVolumeId: z.string().cuid(),
  pageNumber: z.number().int().positive(),
  content: z.string().min(1).max(4000),
});

export const updateNoteSchema = z.object({
  content: z.string().min(1).max(4000),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;
export type UpsertNoteInput = z.infer<typeof upsertNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
