// ═══════════════════════════════════════════
// @javirs/types — RAG & Curriculum Types
// ═══════════════════════════════════════════

export type Curriculum = 'IGCSE' | 'A_LEVEL';
export type DocumentSourceType = 'textbook' | 'past_paper' | 'mark_scheme' | 'notes';

export interface Subject {
  id: string;
  name: string;
  curriculum: Curriculum;
  description: string | null;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  chapter: string | null;
  orderIndex: number;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  topicId: string | null;
  content: string;
  metadata: ChunkMetadata | null;
}

export interface ChunkMetadata {
  page?: number;
  section?: string;
  keywords?: string[];
}

export interface SubjectProgress {
  id: string;
  userId: string;
  topicId: string;
  masteryLevel: number; // 0.0 to 1.0
  questionsAsked: number;
  correctAnswers: number;
  updatedAt: Date;
}
