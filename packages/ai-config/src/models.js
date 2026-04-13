"use strict";
// ═══════════════════════════════════════════
// Model Routing Configuration
// ═══════════════════════════════════════════
Object.defineProperty(exports, "__esModule", { value: true });
exports.RAG_CONFIG = exports.EMBEDDING_CONFIG = exports.MODEL_ROUTES = void 0;
/**
 * Model routing map — routes query complexity to appropriate LLM.
 * Simple queries → cheap mini models (~$0.15/1M tokens)
 * Complex queries → premium models (~$3/1M tokens)
 */
exports.MODEL_ROUTES = {
    simple: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        maxOutputTokens: 500,
        temperature: 0.3,
        costPer1MInput: 0.15,
        costPer1MOutput: 0.60,
    },
    complex: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        maxOutputTokens: 1000,
        temperature: 0.4,
        costPer1MInput: 3.00,
        costPer1MOutput: 15.00,
    },
    grading: {
        provider: 'anthropic',
        model: 'claude-sonnet-4-20250514',
        maxOutputTokens: 1500,
        temperature: 0.2, // Lower temp for more deterministic grading
        costPer1MInput: 3.00,
        costPer1MOutput: 15.00,
    },
};
/**
 * Embedding model config for RAG pipeline
 */
exports.EMBEDDING_CONFIG = {
    model: 'text-embedding-3-small',
    dimensions: 1536,
    costPer1MTokens: 0.02,
};
/**
 * RAG search defaults
 */
exports.RAG_CONFIG = {
    topK: 5,
    similarityThreshold: 0.7,
    chunkSize: 800,
    chunkOverlap: 150,
};
