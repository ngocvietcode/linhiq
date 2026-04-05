import { Injectable, Logger } from '@nestjs/common';
import { streamText, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { RagService } from '../rag/rag.service';
import { DatabaseService } from '../database/database.service';
import {
  SOCRATIC_SYSTEM_PROMPT,
  CLASSIFIER_PROMPT,
  SAFE_CHAT_PROMPT,
  GENTLE_REDIRECT_PROMPT,
  OPEN_CHAT_SYSTEM_PROMPT,
  MODEL_ROUTES,
} from '@javirs/ai-config';
import type { QueryComplexity } from '@javirs/ai-config';
import type { HintLevel } from '@javirs/types';
import type { TopicCategory } from '@javirs/database';

interface ChatHistoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface StreamChatOptions {
  userMessage: string;
  chatHistory: ChatHistoryMessage[];
  subjectId: string;
  subjectName: string;
  curriculum: string;
  hintLevel?: HintLevel;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY || 'dummy' });
  private readonly anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'dummy' });
  private readonly google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy' });

  constructor(
    private readonly rag: RagService,
    private readonly db: DatabaseService,
  ) {}

  /**
   * Get the global AI provider set by Admin, defaulting to gemini
   */
  private async getGlobalProvider(): Promise<'openai' | 'anthropic' | 'gemini'> {
    const setting = await this.db.systemSetting.findUnique({
      where: { id: 'global' },
    });
    return (setting?.defaultAiProvider as any) || 'gemini';
  }

  /**
   * Resolve an LLM instance dynamically based on the active provider
   */
  private resolveModel(provider: 'openai' | 'anthropic' | 'gemini', complexity: QueryComplexity): LanguageModel {
    // If Gemini is active, use gemini-2.5-flash for simple, gemini-2.5-pro for complex/grading
    if (provider === 'gemini') {
      const modelId = complexity === 'simple' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
      return this.google(modelId) as any;
    }
    
    // Fallback logic for original routing (OpenAI vs Anthropic)
    if (provider === 'openai') {
      const modelId = complexity === 'simple' ? 'gpt-4o-mini' : 'gpt-4o';
      return this.openai(modelId) as any;
    }

    if (provider === 'anthropic') {
      const modelId = complexity === 'simple' ? 'claude-3-haiku-20240307' : 'claude-3-5-sonnet-latest';
      return this.anthropic(modelId) as any;
    }

    return this.google('gemini-2.5-flash') as any;
  }

  /**
   * Stream a Socratic AI response with RAG context
   */
  async streamChat(options: StreamChatOptions): Promise<{ stream: any; metadata: any }> {
    const {
      userMessage,
      chatHistory,
      subjectId,
      subjectName,
      curriculum,
      hintLevel = 1,
    } = options;

    const activeProvider = await this.getGlobalProvider();
    
    // 1. Classify query complexity
    const complexity = await this.classifyQuery(userMessage, activeProvider);
    this.logger.log(`Query classified as: ${complexity} using ${activeProvider}`);

    // 2. RAG search for relevant Cambridge content
    const ragResults = await this.rag.search(userMessage, subjectId);
    const ragContext = this.rag.formatContext(ragResults);

    // 3. Build system prompt with RAG context
    const systemPrompt = SOCRATIC_SYSTEM_PROMPT
      .replaceAll('{{SUBJECT}}', subjectName)
      .replaceAll('{{CURRICULUM}}', curriculum)
      .replaceAll('{{HINT_LEVEL}}', String(hintLevel))
      .replaceAll('{{RAG_CONTEXT}}', ragContext);

    // 4. Select model instance
    const model = this.resolveModel(activeProvider, complexity);
    const modelConfig = MODEL_ROUTES[complexity];

    // 5. Stream response
    const result = streamText({
      model,
      system: systemPrompt,
      messages: [
        ...chatHistory.slice(-10),
        { role: 'user' as const, content: userMessage },
      ],
      // @ts-ignore
      maxTokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
    } as any);

    return {
      stream: result,
      metadata: {
        provider: activeProvider,
        complexity,
        ragSources: ragResults.map((r) => ({
          chunkId: r.chunkId,
          documentTitle: r.documentTitle,
          content: r.content.substring(0, 100) + '...',
          similarity: r.similarity,
        })),
      },
    };
  }

  /**
   * Classify query complexity
   */
  private async classifyQuery(query: string, provider: 'openai' | 'anthropic' | 'gemini'): Promise<QueryComplexity> {
    try {
      const prompt = CLASSIFIER_PROMPT.replace('{{QUERY}}', query);
      const model = this.resolveModel(provider, 'simple'); // Always use mini model for classification

      const result = streamText({
        model,
        messages: [{ role: 'user', content: prompt }],
        // @ts-ignore
        maxTokens: 10,
        temperature: 0,
      } as any);

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
  async classifySafeChat(query: string, provider?: 'openai' | 'anthropic' | 'gemini'): Promise<{ category: TopicCategory; shouldRedirect: boolean }> {
    try {
      const activeProvider = provider || await this.getGlobalProvider();
      const prompt = SAFE_CHAT_PROMPT.replace('{{QUERY}}', query);
      const model = this.resolveModel(activeProvider, 'simple'); 

      const result = streamText({
        model,
        messages: [{ role: 'user', content: prompt }],
        // @ts-ignore
        maxTokens: 20,
        temperature: 0,
      } as any);

      let text = '';
      for await (const chunk of result.textStream) {
        text += chunk;
      }

      let classification = text.trim().toUpperCase().replace(/['"]/g, '');
      const validCategories = ['ACADEMIC', 'GENERAL', 'HOBBIES', 'LIFE', 'EMOTIONAL', 'MATURE_SOFT', 'AGE_BOUNDARY', 'HARMFUL'];
      
      if (!validCategories.includes(classification as string)) {
        classification = 'ACADEMIC';
      }

      const shouldRedirect = classification === 'AGE_BOUNDARY' || classification === 'HARMFUL';
      
      return { 
        category: classification as TopicCategory, 
        shouldRedirect 
      };
    } catch (error) {
      this.logger.warn('Safe chat classification failed, defaulting to ACADEMIC', error);
      return { category: 'ACADEMIC' as any, shouldRedirect: false };
    }
  }

  /**
   * Stream Open Chat (F3 — "Chat với Linh")
   * Uses the companion persona, no RAG, no Socratic method.
   */
  async streamOpenChat(options: {
    userMessage: string;
    chatHistory: ChatHistoryMessage[];
  }): Promise<{ stream: any; metadata: any }> {
    const { userMessage, chatHistory } = options;
    const activeProvider = await this.getGlobalProvider();
    const model = this.resolveModel(activeProvider, 'simple');

    const result = streamText({
      model,
      system: OPEN_CHAT_SYSTEM_PROMPT,
      messages: [
        ...chatHistory.slice(-10),
        { role: 'user' as const, content: userMessage },
      ],
      // @ts-ignore
      maxTokens: 300,
      temperature: 0.6,
    } as any);

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
  async streamGentleRedirect(userMessage: string, category: TopicCategory): Promise<{ stream: any; metadata: any }> {
    const activeProvider = await this.getGlobalProvider();
    const systemPrompt = GENTLE_REDIRECT_PROMPT.replace('{{SAFE_CATEGORY}}', category);
    const model = this.resolveModel(activeProvider, 'simple');

    const result = streamText({
      model,
      system: systemPrompt,
      messages: [{ role: 'user' as const, content: userMessage }],
      // @ts-ignore
      maxTokens: 150,
      temperature: 0.3,
    } as any);

    return {
      stream: result,
      metadata: {
        provider: activeProvider,
        wasRedirected: true,
        safeCategory: category,
      },
    };
  }
}
