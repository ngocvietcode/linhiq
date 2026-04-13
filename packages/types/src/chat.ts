// ═══════════════════════════════════════════
// @javirs/types — Chat & AI Types
// ═══════════════════════════════════════════

export type MessageRole = 'user' | 'assistant' | 'system';
export type QueryComplexity = 'simple' | 'complex' | 'grading';
export type HintLevel = 1 | 2 | 3 | 4 | 5;

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  metadata: ChatMessageMetadata | null;
  createdAt: Date;
}

export interface ChatMessageMetadata {
  model?: string;
  tokensUsed?: number;
  costUsd?: number;
  ragSources?: RagSource[];
  complexity?: QueryComplexity;
}

export interface RagSource {
  chunkId: string;
  documentTitle: string;
  content: string;
  similarity: number;
  page?: number;
  chapter?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  subjectId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessagePayload {
  content: string;
  hintLevel?: HintLevel;
}

export interface CreateSessionPayload {
  subjectId: string;
}
