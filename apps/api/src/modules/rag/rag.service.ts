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
   * @param priorityTopicId — if provided, results matching this topic are boosted to the top
   */
  async search(
    query: string,
    subjectId: string,
    topK = RAG_CONFIG.topK,
    priorityTopicId?: string,
  ): Promise<RagResult[]> {
    const hasEmbeddings = await this.hasEmbeddedChunks(subjectId);

    if (hasEmbeddings) {
      return this.vectorSearch(query, subjectId, topK, priorityTopicId);
    }

    return this.keywordSearch(query, subjectId, topK, priorityTopicId);
  }

  /**
   * Vector similarity search using pgvector cosine distance.
   * When priorityTopicId is given, results for that topic appear first.
   */
  private async vectorSearch(
    query: string,
    subjectId: string,
    topK: number,
    priorityTopicId?: string,
  ): Promise<RagResult[]> {
    const embeddingVector = await this.generateEmbedding(query);

    let results: RagResult[];

    if (priorityTopicId) {
      // Priority sort: chunks from the current reader topic come first, then by cosine distance
      results = await this.db.$queryRaw<RagResult[]>`
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
        ORDER BY
          CASE WHEN dc."topicId" = ${priorityTopicId} THEN 0 ELSE 1 END ASC,
          dc.embedding <=> ${embeddingVector}::vector
        LIMIT ${topK}
      `;
    } else {
      results = await this.db.$queryRaw<RagResult[]>`
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
    }

    return results.filter((r) => r.similarity >= RAG_CONFIG.similarityThreshold);
  }

  /**
   * Keyword-based fallback search using PostgreSQL ILIKE.
   * When priorityTopicId is given, results for that topic appear first.
   */
  private async keywordSearch(
    query: string,
    subjectId: string,
    topK: number,
    priorityTopicId?: string,
  ): Promise<RagResult[]> {
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);

    if (keywords.length === 0) return [];

    // Build keyword search using full-text or first keyword only to avoid SQL injection risk in raw template
    // Use a simpler approach: search by the first keyword only (good enough for fallback)
    const keyword = keywords[0];

    const rawChunks = await this.db.$queryRaw<Array<{
      id: string;
      topicId: string | null;
      content: string;
      metadata: unknown;
      documentTitle: string;
      topicName: string | null;
    }>>`
      SELECT
        dc.id,
        dc."topicId",
        dc.content,
        dc.metadata,
        d.title as "documentTitle",
        t.name as "topicName"
      FROM "DocumentChunk" dc
      JOIN "Document" d ON dc."documentId" = d.id
      LEFT JOIN "Topic" t ON dc."topicId" = t.id
      WHERE d."subjectId" = ${subjectId}
        AND dc.content ILIKE ${'%' + keyword + '%'}
      LIMIT ${topK * 2}
    `;

    const mapped = rawChunks.map((chunk) => {
      const metadata = chunk.metadata as ChunkMetadata | null;
      return {
        chunkId: chunk.id,
        content: chunk.content,
        similarity: 0.5,
        documentTitle: chunk.documentTitle,
        page: metadata?.page ?? null,
        chapter: null,
        topicName: chunk.topicName ?? null,
        _topicId: chunk.topicId ?? undefined,
      };
    });

    // Boost priority topic to top
    if (priorityTopicId) {
      mapped.sort((a, b) => {
        const aMatch = a._topicId === priorityTopicId ? 0 : 1;
        const bMatch = b._topicId === priorityTopicId ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    return mapped.slice(0, topK).map(({ _topicId: _unused, ...rest }) => rest);
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
