// ═══════════════════════════════════════════
// Model Routing Configuration
// ═══════════════════════════════════════════

export type QueryComplexity = 'simple' | 'complex' | 'grading';

export interface ModelConfig {
  provider: 'openai' | 'anthropic' | 'gemini';
  model: string;
  maxOutputTokens: number;
  temperature: number;
  costPer1MInput: number;  // USD
  costPer1MOutput: number; // USD
}

/**
 * Model routing map — now pointing strictly to Gemini by default,
 * but allows dynamically checking provider later.
 */
export const MODEL_ROUTES: Record<QueryComplexity, ModelConfig> = {
  simple: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    maxOutputTokens: 500,
    temperature: 0.3,
    costPer1MInput: 0.15,
    costPer1MOutput: 0.60,
  },
  complex: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    maxOutputTokens: 1000,
    temperature: 0.4,
    costPer1MInput: 3.50,
    costPer1MOutput: 10.50,
  },
  grading: {
    provider: 'gemini',
    model: 'gemini-2.5-pro',
    maxOutputTokens: 1500,
    temperature: 0.2,
    costPer1MInput: 3.50,
    costPer1MOutput: 10.50,
  },
};

/**
 * Embedding model config for RAG pipeline
 */
export const EMBEDDING_CONFIG = {
  model: 'gemini-embedding-001', // Gemini model available on the user's key
  dimensions: 3072,              // Gemini gemini-embedding-001 output
  costPer1MTokens: 0.02,
};

/**
 * RAG search defaults
 */
export const RAG_CONFIG = {
  topK: 5,
  similarityThreshold: 0.65, // slightly adjusted for Gemini cosine similarity range
  chunkSize: 800,
  chunkOverlap: 150,
};
