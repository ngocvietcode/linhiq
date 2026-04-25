import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { generateObject, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { DatabaseService } from '../database/database.service';
import { SLIDE_SUMMARY_PROMPT } from '@linhiq/ai-config';
import { slideDeckSchema, type SlideDeck, type SummarizeSlidesInput } from '@linhiq/validators';

@Injectable()
export class SlidesService {
  private readonly logger = new Logger(SlidesService.name);

  constructor(private readonly db: DatabaseService) {}

  async summarize(userId: string, input: SummarizeSlidesInput): Promise<{
    deckId: string;
    deck: SlideDeck;
  }> {
    const startedAt = Date.now();

    const book = await this.db.bookVolume.findUnique({
      where: { id: input.bookId },
      include: { subject: true },
    });
    if (!book) throw new NotFoundException('Book not found');

    // ── 1. Resolve content + topic context ──
    const { content, topicLabel, sourceTitle, pageRangeLabel } =
      await this.collectSourceContent(book.id, book.documentId, input);

    if (!content || content.trim().length < 200) {
      throw new BadRequestException(
        'Not enough source content to summarize. Try a larger page range or a different topic.',
      );
    }

    // ── 2. Build prompt ──
    const language = input.language ?? 'vi';
    const prompt = SLIDE_SUMMARY_PROMPT
      .replaceAll('{{SUBJECT}}', book.subject?.name ?? 'General')
      .replaceAll('{{CURRICULUM}}', String(book.subject?.curriculum ?? ''))
      .replaceAll('{{SOURCE_TITLE}}', sourceTitle)
      .replaceAll('{{TOPIC}}', topicLabel)
      .replaceAll('{{PAGE_RANGE}}', pageRangeLabel)
      .replaceAll('{{DEPTH}}', input.depth)
      .replaceAll('{{LANGUAGE}}', language)
      .replaceAll('{{CONTENT}}', this.truncate(content, 12000));

    // ── 3. Call LLM with structured output ──
    const model = await this.resolveModel();
    let deck: SlideDeck;
    let tokenUsage = 0;
    try {
      const result = await generateObject({
        model,
        schema: slideDeckSchema,
        prompt,
        temperature: 0.5,
        maxOutputTokens: 4000,
      });
      deck = result.object;
      tokenUsage =
        (result.usage?.inputTokens ?? 0) + (result.usage?.outputTokens ?? 0);
    } catch (err) {
      this.logger.error('Slide deck generation failed', err);
      throw new BadRequestException('Failed to generate slide deck. Please try again.');
    }

    // ── 4. Persist snapshot ──
    const snapshot = await this.db.slideDeckSnapshot.create({
      data: {
        userId,
        subjectId: book.subjectId,
        bookVolumeId: book.id,
        topicId: input.topicId ?? null,
        pageStart: input.pageStart ?? null,
        pageEnd: input.pageEnd ?? null,
        title: deck.title,
        language: deck.language,
        depth: input.depth,
        deckJson: deck as unknown as object,
        tokenUsage,
        durationMs: Date.now() - startedAt,
      },
    });

    return { deckId: snapshot.id, deck };
  }

  async getDeck(userId: string, deckId: string) {
    const snap = await this.db.slideDeckSnapshot.findUnique({ where: { id: deckId } });
    if (!snap) throw new NotFoundException('Deck not found');
    if (snap.userId !== userId) throw new NotFoundException('Deck not found');
    return {
      id: snap.id,
      title: snap.title,
      language: snap.language,
      depth: snap.depth,
      deck: snap.deckJson as unknown as SlideDeck,
      createdAt: snap.createdAt,
    };
  }

  async listForUser(userId: string, limit = 30) {
    const items = await this.db.slideDeckSnapshot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, title: true, language: true, depth: true,
        bookVolumeId: true, subjectId: true, topicId: true,
        pageStart: true, pageEnd: true, createdAt: true,
      },
    });
    return items;
  }

  // ─────────────────────────────────────────────────────────────────
  // Internal helpers
  // ─────────────────────────────────────────────────────────────────

  private async collectSourceContent(
    bookVolumeId: string,
    documentId: string | null,
    input: SummarizeSlidesInput,
  ): Promise<{
    content: string;
    topicLabel: string;
    sourceTitle: string;
    pageRangeLabel: string;
  }> {
    const book = await this.db.bookVolume.findUnique({ where: { id: bookVolumeId } });
    const sourceTitle = book?.title ?? 'Textbook';

    // Path A: explicit topic
    if (input.topicId) {
      const topic = await this.db.topic.findUnique({ where: { id: input.topicId } });
      const chunks = await this.db.documentChunk.findMany({
        where: { topicId: input.topicId },
        select: { content: true, chunkIndex: true },
        orderBy: { chunkIndex: 'asc' },
        take: 30,
      });
      return {
        content: chunks.map((c) => c.content).join('\n\n'),
        topicLabel: topic?.name ?? 'Topic',
        sourceTitle,
        pageRangeLabel: 'topic-scoped',
      };
    }

    // Path B: page range — pull chunks tagged via BookPageTopic + chunks belonging to the book document
    const start = input.pageStart!;
    const end = input.pageEnd!;
    if (end < start) throw new BadRequestException('pageEnd must be ≥ pageStart');
    if (end - start > 30) throw new BadRequestException('Page range too large (max 30 pages)');

    // Topic context: take the dominant topic across the page range, if any
    const pageTopics = await this.db.bookPageTopic.findMany({
      where: { bookVolumeId, pageNumber: { gte: start, lte: end } },
      include: { topic: { select: { name: true } } },
    });
    const topicLabel =
      pageTopics
        .map((p) => p.topic?.name)
        .filter((v): v is string => !!v)[0] ?? 'general';

    // Pull chunks belonging to the underlying document, filtered by page metadata when available
    if (!documentId) {
      return { content: '', topicLabel, sourceTitle, pageRangeLabel: `p.${start}-${end}` };
    }

    const rawChunks = await this.db.$queryRaw<Array<{ content: string; page: number | null }>>`
      SELECT dc.content,
             (dc.metadata->>'page')::int as page
      FROM "DocumentChunk" dc
      WHERE dc."documentId" = ${documentId}
        AND (dc.metadata->>'page')::int BETWEEN ${start} AND ${end}
      ORDER BY (dc.metadata->>'page')::int ASC, dc."chunkIndex" ASC
      LIMIT 60
    `;

    let content = rawChunks.map((c) => c.content).join('\n\n');

    // Fallback: if no page-tagged chunks, take chunks linked via topic
    if (!content && pageTopics.length > 0) {
      const topicIds = Array.from(
        new Set(pageTopics.map((p) => p.topicId).filter((v): v is string => !!v)),
      );
      if (topicIds.length > 0) {
        const fallback = await this.db.documentChunk.findMany({
          where: { topicId: { in: topicIds } },
          select: { content: true },
          take: 40,
        });
        content = fallback.map((c) => c.content).join('\n\n');
      }
    }

    return { content, topicLabel, sourceTitle, pageRangeLabel: `p.${start}-${end}` };
  }

  private async resolveModel(): Promise<LanguageModel> {
    const settings = await this.db.systemSetting.findUnique({ where: { id: 'global' } });
    const litellm = createOpenAI({
      baseURL: settings?.liteLlmUrl || process.env.LITELLM_URL || 'http://localhost:4000/v1',
      apiKey: settings?.liteLlmApiKey || process.env.LITELLM_API_KEY || 'dummy',
    });
    const modelId = settings?.complexQueryModel || 'gemini-2.5-pro';
    return litellm(modelId);
  }

  private truncate(s: string, maxChars: number): string {
    if (s.length <= maxChars) return s;
    return s.slice(0, maxChars) + '\n\n...[truncated]';
  }
}
