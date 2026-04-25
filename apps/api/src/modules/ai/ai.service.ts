import { Injectable, Logger } from '@nestjs/common';
import { streamText, generateObject, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

import { RagService } from '../rag/rag.service';
import { DatabaseService } from '../database/database.service';
import {
  SOCRATIC_SYSTEM_PROMPT,
  SOCRATIC_VISION_PROMPT,
  CLASSIFIER_PROMPT,
  SAFE_CHAT_PROMPT,
  GENTLE_REDIRECT_PROMPT,
  OPEN_CHAT_SYSTEM_PROMPT,
  ANSWER_EVAL_PROMPT,
  QUIZ_GENERATOR_PROMPT,
  MODEL_ROUTES,
} from '@linhiq/ai-config';
import type { QueryComplexity, AnswerQuality } from '@linhiq/ai-config';
import type { HintLevel } from '@linhiq/types';
import type { TopicCategory } from '@linhiq/database';

interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ReaderContext {
  bookVolumeId?: string;
  topicId?: string;
  pageNumber?: number;
  chapterName?: string;
  topicName?: string;
}

interface StreamChatOptions {
  userMessage: string;
  chatHistory: ChatHistoryMessage[];
  subjectId: string;
  subjectName: string;
  curriculum: string;
  hintLevel?: HintLevel;
  imageUrl?: string | null;      // R2 signed URL (preferred if available)
  imageBase64?: string | null;   // base64-encoded image (no data: prefix, fallback)
  imageMimeType?: string | null; // e.g. "image/jpeg"
  readerContext?: ReaderContext; // context from textbook reader
}


interface StreamResult {
  stream: ReturnType<typeof streamText>;
  metadata: Record<string, unknown>;
}

interface SystemSettings {
  id: string;
  liteLlmUrl?: string | null;
  liteLlmApiKey?: string | null;
  simpleQueryModel: string;
  complexQueryModel: string;
  embeddingModel: string;
  openChatPrompt?: string | null;
  maxTokensOpenChat: number;
  maxTokensSocratic: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly rag: RagService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Get the global system settings for AI routing
   */
  private async getSystemSettings(): Promise<SystemSettings> {
    const setting = await this.db.systemSetting.findUnique({
      where: { id: 'global' },
    });
    return setting || {
      id: 'global',
      liteLlmUrl: null,
      liteLlmApiKey: null,
      simpleQueryModel: 'gemini-2.5-flash',
      complexQueryModel: 'gemini-2.5-pro',
      embeddingModel: 'gemini-embedding-001',
      openChatPrompt: null,
      maxTokensOpenChat: 300,
      maxTokensSocratic: 1024,
    };
  }

  /**
   * Resolve an LLM instance dynamically (now universally via LiteLLM)
   */
  private async resolveModel(complexity: QueryComplexity): Promise<{ model: LanguageModel, provider: string }> {
    const settings = await this.getSystemSettings();
    const modelId = complexity === 'simple' ? settings.simpleQueryModel : settings.complexQueryModel;
    
    // Everything routed through litellm proxy now
    const litellm = createOpenAI({
      baseURL: settings.liteLlmUrl || process.env.LITELLM_URL || 'http://localhost:4000/v1',
      apiKey: settings.liteLlmApiKey || process.env.LITELLM_API_KEY || 'dummy',
    });
    
    const model = litellm(modelId);

    return { model, provider: modelId };
  }

  /**
   * Stream a Socratic AI response with RAG context
   */
  async streamChat(options: StreamChatOptions): Promise<StreamResult> {
    const {
      userMessage,
      chatHistory,
      subjectId,
      subjectName,
      curriculum,
      hintLevel = 1,
      imageUrl,
      imageBase64: imageBase64Input,
      imageMimeType = 'image/jpeg',
      readerContext,
    } = options;

    // Resolve image: prefer R2 URL (download + convert), fallback to inline base64
    let imageBase64: string | null = imageBase64Input ?? null;
    let resolvedMimeType = imageMimeType ?? 'image/jpeg';
    if (imageUrl && !imageBase64) {
      try {
        const imgRes = await fetch(imageUrl);
        if (imgRes.ok) {
          const contentType = imgRes.headers.get('content-type') ?? resolvedMimeType;
          resolvedMimeType = contentType.split(';')[0];
          const arrayBuffer = await imgRes.arrayBuffer();
          imageBase64 = Buffer.from(arrayBuffer).toString('base64');
          this.logger.log(`Downloaded image from R2: ${imageUrl.substring(0, 80)}...`);
        }
      } catch (err) {
        this.logger.warn('Failed to fetch image from R2 URL, skipping vision:', err);
      }
    }

    // 1. Load settings + classify complexity
    const settings = await this.getSystemSettings();
    const complexity = imageBase64 ? 'complex' : await this.classifyQuery(userMessage);

    // 2. Build context-boosted search query when in reader mode
    let searchQuery = userMessage.trim() || `image question in ${subjectName}`;
    if (readerContext?.topicName) {
      searchQuery = `[Context: ${readerContext.chapterName ? `${readerContext.chapterName} - ` : ''}${readerContext.topicName}] ${searchQuery}`;
    }

    // 3. RAG search — pass priorityTopicId to boost reader-page-topic results
    const ragResults = await this.rag.search(searchQuery, subjectId, undefined, readerContext?.topicId);
    const ragContext = this.rag.formatContext(ragResults);

    // 4. Build system prompt — use vision-specific prompt when image is attached
    const basePrompt = imageBase64 ? SOCRATIC_VISION_PROMPT : SOCRATIC_SYSTEM_PROMPT;
    const systemPrompt = basePrompt
      .replaceAll('{{SUBJECT}}', subjectName)
      .replaceAll('{{CURRICULUM}}', curriculum)
      .replaceAll('{{HINT_LEVEL}}', String(hintLevel))
      .replaceAll('{{RAG_CONTEXT}}', ragContext);

    // 5. Select model instance
    const { model, provider: activeProvider } = await this.resolveModel(complexity);
    this.logger.log(`Query classified as: ${complexity} using ${activeProvider}`);
    const modelConfig = MODEL_ROUTES[complexity];

    // 6. Build user content — text-only or multipart vision
    let userContent: string | Array<{ type: string; image?: string; text?: string }>;
    if (imageBase64) {
      userContent = [
        {
          type: 'image',
          image: `data:${resolvedMimeType};base64,${imageBase64}`,
        },
        ...(userMessage.trim() ? [{ type: 'text', text: userMessage }] : [{
          type: 'text',
          text: 'Please look at this image and help me understand this problem using the Socratic method.',
        }]),
      ];
    } else {
      userContent = userMessage;
    }

    // 7. Stream response
    try {
      const result = streamText({
        model,
        system: systemPrompt,
        messages: [
          ...chatHistory.slice(-10),
          { role: 'user' as const, content: userContent as string },
        ],
        maxOutputTokens: settings.maxTokensSocratic || modelConfig.maxOutputTokens,
        temperature: modelConfig.temperature,
      });

      // Enrich sources with page numbers when in reader mode:
      // fall back to BookPageTopic if chunk metadata is missing pageNumber.
      const enrichedSources = await this.resolveSourcePages(
        ragResults.map((r) => ({
          chunkId: r.chunkId,
          documentTitle: r.documentTitle,
          content: r.content.substring(0, 100) + '...',
          similarity: r.similarity,
          page: r.page,
        })),
        readerContext?.bookVolumeId,
      );

      return {
        stream: result,
        metadata: {
          provider: activeProvider,
          complexity,
          hasImage: !!imageBase64,
          readerContext: readerContext ?? null,
          ragSources: enrichedSources,
        },
      };
    } catch (e) {
      this.logger.error('Stream generation failed:', e);
      throw e;
    }
  }

  /**
   * Resolve missing page numbers on RAG sources via BookPageTopic.
   * When the user is reading a specific book and a chunk has no `metadata.page`,
   * fall back to the first page of the chunk's topic in that book.
   */
  private async resolveSourcePages<
    T extends { chunkId: string; page: number | null },
  >(
    sources: T[],
    bookVolumeId: string | undefined,
  ): Promise<T[]> {
    if (!bookVolumeId) return sources;
    const missing = sources.filter((s) => s.page == null).map((s) => s.chunkId);
    if (missing.length === 0) return sources;

    try {
      const chunks = await this.db.documentChunk.findMany({
        where: { id: { in: missing } },
        select: { id: true, topicId: true },
      });
      const topicIds = Array.from(
        new Set(chunks.map((c) => c.topicId).filter((t): t is string => !!t)),
      );
      if (topicIds.length === 0) return sources;

      const pageTopics = await this.db.bookPageTopic.findMany({
        where: { bookVolumeId, topicId: { in: topicIds } },
        orderBy: { pageNumber: 'asc' },
      });
      const topicToFirstPage = new Map<string, number>();
      for (const pt of pageTopics) {
        if (pt.topicId && !topicToFirstPage.has(pt.topicId)) {
          topicToFirstPage.set(pt.topicId, pt.pageNumber);
        }
      }
      const chunkToPage = new Map<string, number>();
      for (const c of chunks) {
        if (c.topicId) {
          const p = topicToFirstPage.get(c.topicId);
          if (p) chunkToPage.set(c.id, p);
        }
      }
      return sources.map((s) =>
        s.page == null ? { ...s, page: chunkToPage.get(s.chunkId) ?? null } : s,
      );
    } catch (err) {
      this.logger.warn('resolveSourcePages failed:', err);
      return sources;
    }
  }

  /**
   * Classify query complexity
   */
  private async classifyQuery(query: string): Promise<QueryComplexity> {
    try {
      const prompt = CLASSIFIER_PROMPT.replace('{{QUERY}}', query);
      const { model } = await this.resolveModel('simple'); // Always use mini model for classification

      const result = streamText({
        model,
        messages: [{ role: 'user', content: prompt }],
        maxOutputTokens: 10,
        temperature: 0,
      });

      let text = '';
      for await (const chunk of result.textStream) {
        text += chunk;
      }

      const classification = text.trim().toLowerCase();
      if (['simple', 'complex', 'grading'].includes(classification)) {
        return classification as QueryComplexity;
      }
      return 'simple';
    } catch (error) {
      this.logger.warn('Classification failed, defaulting to simple', error);
      return 'simple';
    }
  }

  /**
   * Classify message safety securely
   */
  async classifySafeChat(query: string): Promise<{ category: TopicCategory; shouldRedirect: boolean }> {
    try {
      const prompt = SAFE_CHAT_PROMPT.replace('{{QUERY}}', query);
      const { model } = await this.resolveModel('simple'); 

      const result = streamText({
        model,
        messages: [{ role: 'user', content: prompt }],
        maxOutputTokens: 20,
        temperature: 0,
      });

      let text = '';
      for await (const chunk of result.textStream) {
        text += chunk;
      }

      let classification = text.trim().toUpperCase().replace(/['"]/g, '');
      const validCategories: TopicCategory[] = [
        'ACADEMIC', 'GENERAL', 'HOBBIES', 'LIFE',
        'EMOTIONAL', 'MATURE_SOFT', 'AGE_BOUNDARY', 'HARMFUL',
      ];
      
      if (!validCategories.includes(classification as TopicCategory)) {
        classification = 'ACADEMIC';
      }

      const shouldRedirect = classification === 'AGE_BOUNDARY' || classification === 'HARMFUL';
      
      return { 
        category: classification as TopicCategory, 
        shouldRedirect 
      };
    } catch (error) {
      this.logger.warn('Safe chat classification failed, defaulting to ACADEMIC', error);
      return { category: 'ACADEMIC' as TopicCategory, shouldRedirect: false };
    }
  }

  /**
   * Stream Open Chat (F3 — "Chat với Linh")
   * Uses the companion persona, no RAG, no Socratic method.
   */
  async streamOpenChat(options: {
    userMessage: string;
    chatHistory: ChatHistoryMessage[];
  }): Promise<StreamResult> {
    const { userMessage, chatHistory } = options;
    const settings = await this.getSystemSettings();
    const { model, provider: activeProvider } = await this.resolveModel('simple');

    const result = streamText({
      model,
      system: settings.openChatPrompt || OPEN_CHAT_SYSTEM_PROMPT,
      messages: [
        ...chatHistory.slice(-10),
        { role: 'user' as const, content: userMessage },
      ],
      maxOutputTokens: settings.maxTokensOpenChat || 300,
      temperature: 0.6,
    });

    return {
      stream: result,
      metadata: {
        provider: activeProvider,
        mode: 'open-chat',
      },
    };
  }

  /**
   * Stream Gentle Redirect
   */
  async streamGentleRedirect(userMessage: string, category: TopicCategory): Promise<StreamResult> {
    const systemPrompt = GENTLE_REDIRECT_PROMPT.replace('{{SAFE_CATEGORY}}', category);
    const { model, provider: activeProvider } = await this.resolveModel('simple');

    const result = streamText({
      model,
      system: systemPrompt,
      messages: [{ role: 'user' as const, content: userMessage }],
      maxOutputTokens: 150,
      temperature: 0.3,
    });

    return {
      stream: result,
      metadata: {
        provider: activeProvider,
        wasRedirected: true,
        safeCategory: category,
      },
    };
  }
  /**
   * Evaluate the quality of a student's answer after an AI exchange.
   * Runs silently in the background — does NOT block the SSE stream.
   *
   * Returns:
   *   NOT_ANSWER → student was asking, not answering — skip mastery update
   *   CORRECT    → good answer, wasSuccessful = true
   *   PARTIAL    → partial answer, wasSuccessful = false (question counted, not correct)
   *   INCORRECT  → wrong answer, wasSuccessful = false
   */
  async evaluateAnswer(
    studentMessage: string,
    aiResponse: string,
    subjectName: string,
  ): Promise<AnswerQuality> {
    try {
      const { model } = await this.resolveModel('simple'); // always use flash

      const prompt = ANSWER_EVAL_PROMPT
        .replace('{{SUBJECT}}', subjectName)
        .replace('{{STUDENT_MESSAGE}}', studentMessage.substring(0, 500))
        .replace('{{AI_RESPONSE}}', aiResponse.substring(0, 800));

      const result = streamText({
        model,
        messages: [{ role: 'user', content: prompt }],
        maxOutputTokens: 5,
        temperature: 0,
      });

      let text = '';
      for await (const chunk of result.textStream) {
        text += chunk;
      }

      const quality = text.trim().toUpperCase() as AnswerQuality;
      const valid: AnswerQuality[] = ['NOT_ANSWER', 'CORRECT', 'PARTIAL', 'INCORRECT'];
      return valid.includes(quality) ? quality : 'NOT_ANSWER';
    } catch (error) {
      this.logger.warn('Answer evaluation failed, skipping mastery update', error);
      return 'NOT_ANSWER'; // safe default: do nothing
    }
  }

  /**
   * Generate MCQ quiz questions from RAG content.
   * topics: array of { id, name } for the quiz scope
   * questionCount: 5 for topic quiz, 15 for milestone/section quiz
   */
  async generateQuiz(options: {
    topics: { id: string; name: string }[];
    subjectName: string;
    questionCount: number;
    subjectId: string;
  }): Promise<{ topicId: string; question: string; options: string[]; correctAnswer: string; explanation: string }[]> {
    const { topics, subjectName, questionCount, subjectId } = options;
    // Use pro model for quiz quality
    const { model } = await this.resolveModel('complex');

    // Gather RAG context for all topics
    const ragContextParts: string[] = [];
    for (const topic of topics) {
      const results = await this.rag.search(topic.name, subjectId, 3);
      if (results.length > 0) {
        ragContextParts.push(`## ${topic.name}\n${this.rag.formatContext(results)}`);
      }
    }
    const ragContext = ragContextParts.join('\n\n') || 'Use general Cambridge IGCSE knowledge.';

    const prompt = QUIZ_GENERATOR_PROMPT
      .replace('{{SUBJECT}}', subjectName)
      .replace('{{TOPIC_NAMES}}', topics.map(t => t.name).join(', '))
      .replace('{{RAG_CONTEXT}}', ragContext.substring(0, 6000))
      .replace(/\{\{QUESTION_COUNT\}\}/g, String(questionCount));

    let parsed: Array<{ topicName?: string; question: string; options: string[]; correctAnswer: string; explanation: string }>;
    try {
      const result = await generateObject({
        model,
        messages: [{ role: 'user', content: prompt }],
        maxOutputTokens: 8192,
        temperature: 0.3,
        schema: z.array(
          z.object({
            topicName: z.string().optional(),
            question: z.string(),
            options: z.array(z.string()),
            correctAnswer: z.string(),
            explanation: z.string(),
          })
        ),
      });
      parsed = result.object;
    } catch (e) {
      this.logger.error('Quiz generation failed', e);
      throw new Error('Quiz generation failed — invalid JSON from LLM');
    }

    // Map topicName back to topicId
    const topicMap = new Map(topics.map(t => [t.name.toLowerCase(), t.id]));

    return parsed.map((q, i) => {
      const topicId = topicMap.get((q.topicName ?? '').toLowerCase())
        ?? topics[i % topics.length]?.id  // fallback: round-robin
        ?? topics[0].id;
      return {
        topicId,
        question: String(q.question ?? ''),
        options: Array.isArray(q.options) ? q.options.map(String) : [],
        correctAnswer: String(q.correctAnswer ?? 'A').toUpperCase().charAt(0),
        explanation: String(q.explanation ?? ''),
      };
    });
  }
}
