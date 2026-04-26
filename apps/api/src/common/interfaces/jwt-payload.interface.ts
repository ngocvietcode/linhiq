// ═══════════════════════════════════════════
// JWT Payload & Request Types
// ═══════════════════════════════════════════

import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string | null;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Express Request extended with authenticated user payload.
 * Use this instead of `req: any` in controllers.
 */
export interface RequestWithUser extends Request {
  user: JwtPayload;
}
