import { Injectable, Logger } from '@nestjs/common';
import { embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { DatabaseService } from '../database/database.service';
import { RAG_CONFIG } from '@linhiq/ai-config';

interface RagResult {
  chunkId: string;
  content: string;
  similarity: number;
  documentTitle: string;
  page: number | null;
  chapter: string | null;
  topicName: string | null;
}

interface ChunkMetadata {
  page?: number;
  section?: string;
  chapter?: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Perform vector similarity search against document chunks.
   * Falls back to keyword search if embeddings are not available.
   */
  async search(query: string, subjectId: string, topK = RAG_CONFIG.topK): Promise<RagResult[]> {
    // Phase 1: Keyword-based full-text search (works without embeddings)
    // Phase 2: Vector search will be added when embeddings are ingested
    const hasEmbeddings = await this.hasEmbeddedChunks(subjectId);

    if (hasEmbeddings) {
      return this.vectorSearch(query, subjectId, topK);
    }

    return this.keywordSearch(query, subjectId, topK);
  }

  /**
   * Vector similarity search using pgvector cosine distance
   */
  private async vectorSearch(query: string, subjectId: string, topK: number): Promise<RagResult[]> {
    // Generate embedding for query using OpenAI
    const embeddingVector = await this.generateEmbedding(query);

    const results = await this.db.$queryRaw<RagResult[]>`
      SELECT
        dc.id as "chunkId",
        dc.content,
        1 - (dc.embedding <=> ${embeddingVector}::vector) as similarity,
        d.title as "documentTitle",
        (dc.metadata->>'page')::int as page,
        m.name as chapter,
        t.name as "topicName"
      FROM "DocumentChunk" dc
      JOIN "Document" d ON dc."documentId" = d.id
      LEFT JOIN "Topic" t ON dc."topicId" = t.id
      LEFT JOIN "Milestone" m ON t."milestoneId" = m.id
      WHERE d."subjectId" = ${subjectId}
        AND dc.embedding IS NOT NULL
      ORDER BY dc.embedding <=> ${embeddingVector}::vector
      LIMIT ${topK}
    `;

    return results.filter((r) => r.similarity >= RAG_CONFIG.similarityThreshold);
  }

  /**
   * Keyword-based fallback search using PostgreSQL ILIKE
   */
  private async keywordSearch(query: string, subjectId: string, topK: number): Promise<RagResult[]> {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);

    if (keywords.length === 0) return [];

    const chunks = await this.db.documentChunk.findMany({
      where: {
        document: { subjectId },
        OR: keywords.map((kw) => ({
          content: { contains: kw, mode: 'insensitive' as const },
        })),
      },
      include: {
        document: { select: { title: true } },
        topic: { select: { name: true, milestone: { select: { name: true } } } },
      },
      take: topK,
    });

    return chunks.map((chunk) => {
      const metadata = chunk.metadata as ChunkMetadata | null;
      return {
        chunkId: chunk.id,
        content: chunk.content,
        similarity: 0.5, // Keyword matches get a fixed score
        documentTitle: chunk.document.title,
        page: metadata?.page ?? null,
        chapter: chunk.topic?.milestone?.name ?? null,
        topicName: chunk.topic?.name ?? null,
      };
    });
  }

  /**
   * Generate embedding vector for a query string using Gemini
   */
  private async generateEmbedding(text: string): Promise<string> {
    const settings = await this.db.systemSetting.findUnique({ where: { id: 'global' } });
    const litellm = createOpenAI({ 
      baseURL: settings?.liteLlmUrl || process.env.LITELLM_URL || 'http://localhost:4000/v1',
      apiKey: settings?.liteLlmApiKey || process.env.LITELLM_API_KEY || 'dummy',
    });
    const embeddingModelStr = settings?.embeddingModel || 'gemini-embedding-001';
    
    const { embedding: embeddingResult } = await embed({
      model: litellm.textEmbeddingModel(embeddingModelStr),
      value: text,
    });

    return `[${embeddingResult.join(',')}]`;
  }

  /**
   * Check if any chunks for this subject have embeddings
   */
  private async hasEmbeddedChunks(subjectId: string): Promise<boolean> {
    const result = await this.db.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count
      FROM "DocumentChunk" dc
      JOIN "Document" d ON dc."documentId" = d.id
      WHERE d."subjectId" = ${subjectId}
        AND dc.embedding IS NOT NULL
    `;
    return Number(result[0]?.count) > 0;
  }

  /**
   * Format RAG results into a context string for the LLM
   */
  formatContext(results: RagResult[]): string {
    if (results.length === 0) {
      return 'No relevant Cambridge materials found for this query.';
    }

    return results
      .map(
        (r, i) =>
          `[Source ${i + 1}: ${r.documentTitle}${r.chapter ? ` — ${r.chapter}` : ''}${r.page ? ` (p.${r.page})` : ''}]\n${r.content}`,
      )
      .join('\n\n---\n\n');
  }
}
