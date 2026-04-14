import { Injectable, Logger } from '@nestjs/common';
import { streamText, generateObject, type LanguageModel } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

import { RagService } from '../rag/rag.service';
import { DatabaseService } from '../database/database.service';
import {
  SOCRATIC_SYSTEM_PROMPT,
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

interface StreamChatOptions {
  userMessage: string;
  chatHistory: ChatHistoryMessage[];
  subjectId: string;
  subjectName: string;
  curriculum: string;
  hintLevel?: HintLevel;
  imageBase64?: string | null;   // base64-encoded image (no data: prefix)
  imageMimeType?: string | null; // e.g. "image/jpeg"
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
      imageBase64,
      imageMimeType = 'image/jpeg',
    } = options;

    // 1. Classify query complexity (images are always complex)
    const complexity = imageBase64 ? 'complex' : await this.classifyQuery(userMessage);

    // 2. RAG search using text (image descriptions aren't available yet, use text or fallback)
    const searchQuery = userMessage.trim() || `image question in ${subjectName}`;
    const ragResults = await this.rag.search(searchQuery, subjectId);
    const ragContext = this.rag.formatContext(ragResults);

    // 3. Build system prompt with RAG context
    const systemPrompt = SOCRATIC_SYSTEM_PROMPT
      .replaceAll('{{SUBJECT}}', subjectName)
      .replaceAll('{{CURRICULUM}}', curriculum)
      .replaceAll('{{HINT_LEVEL}}', String(hintLevel))
      .replaceAll('{{RAG_CONTEXT}}', ragContext);

    // 4. Select model instance
    const { model, provider: activeProvider } = await this.resolveModel(complexity);
    this.logger.log(`Query classified as: ${complexity} using ${activeProvider}`);
    const modelConfig = MODEL_ROUTES[complexity];

    // 5. Build user content — text-only or multipart vision
    let userContent: string | Array<{ type: string; image?: string; text?: string }>;
    if (imageBase64) {
      userContent = [
        {
          type: 'image',
          image: `data:${imageMimeType};base64,${imageBase64}`,
        },
        ...(userMessage.trim() ? [{ type: 'text', text: userMessage }] : [{
          type: 'text',
          text: 'Please look at this image and help me understand this problem using the Socratic method.',
        }]),
      ];
    } else {
      userContent = userMessage;
    }

    // 6. Stream response
    try {
      const result = streamText({
        model,
        system: systemPrompt,
        messages: [
          ...chatHistory.slice(-10),
          { role: 'user' as const, content: userContent as string },
        ],
        maxOutputTokens: modelConfig.maxOutputTokens,
        temperature: modelConfig.temperature,
      });

      return {
        stream: result,
        metadata: {
          provider: activeProvider,
          complexity,
          hasImage: !!imageBase64,
          ragSources: ragResults.map((r) => ({
            chunkId: r.chunkId,
            documentTitle: r.documentTitle,
            content: r.content.substring(0, 100) + '...',
            similarity: r.similarity,
          })),
        },
      };
    } catch (e) {
      this.logger.error('Stream generation failed:', e);
      throw e;
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
    const { model, provider: activeProvider } = await this.resolveModel('simple');

    const result = streamText({
      model,
      system: OPEN_CHAT_SYSTEM_PROMPT,
      messages: [
        ...chatHistory.slice(-10),
        { role: 'user' as const, content: userMessage },
      ],
      maxOutputTokens: 300,
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
