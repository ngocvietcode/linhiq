export type QueryComplexity = 'simple' | 'complex' | 'grading';
export interface ModelConfig {
    provider: 'openai' | 'anthropic';
    model: string;
    maxTokens: number;
    temperature: number;
    costPer1MInput: number;
    costPer1MOutput: number;
}
/**
 * Model routing map — routes query complexity to appropriate LLM.
 * Simple queries → cheap mini models (~$0.15/1M tokens)
 * Complex queries → premium models (~$3/1M tokens)
 */
export declare const MODEL_ROUTES: Record<QueryComplexity, ModelConfig>;
/**
 * Embedding model config for RAG pipeline
 */
export declare const EMBEDDING_CONFIG: {
    model: string;
    dimensions: number;
    costPer1MTokens: number;
};
/**
 * RAG search defaults
 */
export declare const RAG_CONFIG: {
    topK: number;
    similarityThreshold: number;
    chunkSize: number;
    chunkOverlap: number;
};
