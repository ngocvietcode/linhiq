// ═══════════════════════════════════════════
// @javirs/types — User & Auth Types
// ═══════════════════════════════════════════

export type Role = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthSession {
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
  accessToken: string;
  expiresAt: Date;
}
