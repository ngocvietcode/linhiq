import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { ProgressService } from '../progress/progress.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { createSessionSchema, sendMessageSchema } from '@linhiq/validators';
import type { RequestWithUser } from '../../common/interfaces/jwt-payload.interface';
import type { HintLevel as DbHintLevel } from '@linhiq/database';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chat: ChatService,
    private readonly ai: AiService,
    private readonly progress: ProgressService,
  ) {}

  @Post('sessions')
  async createSession(@Body() body: unknown, @Req() req: RequestWithUser) {
    const input = createSessionSchema.parse(body);
    const finalSubjectId = input.subjectId === "undefined" ? undefined : input.subjectId;
    return this.chat.createSession(req.user.sub, finalSubjectId);
  }

  @Get('sessions')
  async getSessions(@Req() req: RequestWithUser) {
    return this.chat.getSessions(req.user.sub);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string, @Req() req: RequestWithUser) {
    const session = await this.chat.getSession(id, req.user.sub);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string, @Req() req: RequestWithUser) {
    await this.chat.deleteSession(id, req.user.sub);
    return { success: true };
  }

  /**
   * POST /chat/sessions/:id/message
   * Streams AI response via SSE (Server-Sent Events)
   */
  @Post('sessions/:id/message')
  async sendMessage(
    @Param('id') sessionId: string,
    @Body() body: unknown,
    @Req() req: RequestWithUser,
    @Res() res: Response,
  ) {
    try {
    const input = sendMessageSchema.parse(body);

    // Verify session ownership and get session with subject
    const session = await this.chat.getSession(sessionId, req.user.sub);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const content = input.content || "";

    // 1. Classify Safe Chat
    const { category, shouldRedirect } = await this.ai.classifySafeChat(content);

    // Save user message with topic category
    await this.chat.saveMessage(sessionId, 'user', content, {
      safeCategory: category,
    });

    // Auto-generate session title from first message
    if (!session.title) {
      const title =
        content.length > 50
          ? content.substring(0, 47) + '...'
          : content || 'Image Upload';
      await this.chat.updateSessionTitle(sessionId, title);
    }

    // Get chat history
    const history = session.messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Map HintLevel (string-cast to handle Prisma client cache)
    const hintLevelMap: Record<number, DbHintLevel> = { 1: 'L1', 2: 'L2', 3: 'L3', 4: 'L4', 5: 'L5' };
    const dbHintLevel: DbHintLevel = hintLevelMap[input.hintLevel ?? 1] ?? 'L1';

    // Stream AI response: Redirect > Open Chat > Socratic
    let aiResponse;
    if (shouldRedirect) {
      // Safety redirect takes priority in ALL modes
      aiResponse = await this.ai.streamGentleRedirect(content, category);
    } else if (session.mode === 'OPEN') {
      // F3: Open Chat — "Chat với Linh" companion mode
      aiResponse = await this.ai.streamOpenChat({
        userMessage: content,
        chatHistory: history,
      });
    } else {
      // F1: Socratic Tutor — subject study mode
      aiResponse = await this.ai.streamChat({
        userMessage: content,
        chatHistory: history,
        subjectId: session.subjectId ?? '',
        subjectName: session.subject?.name ?? 'General',
        curriculum: session.subject?.curriculum ?? 'GENERAL',
        hintLevel: input.hintLevel,
        imageUrl: input.imageUrl ?? undefined,
        imageBase64: input.imageBase64,
        imageMimeType: input.imageMimeType,
        readerContext: input.readerContext ? {
          bookVolumeId: input.readerContext.bookVolumeId ?? undefined,
          topicId: input.readerContext.topicId ?? undefined,
          pageNumber: input.readerContext.pageNumber ?? undefined,
          chapterName: input.readerContext.chapterName ?? undefined,
          topicName: input.readerContext.topicName ?? undefined,
        } : undefined,
      });
    }

    const { stream, metadata } = aiResponse;

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Stream tokens to client
    let fullResponse = '';
    try {
      for await (const chunk of stream.textStream) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
      }

      // Post-stream: evaluate student's answer quality, then update mastery
      let masteryUpdate: { topicId: string; masteryLevel: number; answerQuality: string } | undefined;

      if (!shouldRedirect && session.mode !== 'OPEN') {
        const ragSources = metadata?.ragSources as Array<{ chunkId: string }> | undefined;
        const chunkIds = ragSources?.map((r) => r.chunkId) ?? [];
        const topicId = await this.progress.getTopicIdFromChunks(chunkIds);

        if (topicId) {
          // Ask AI to evaluate whether the student was answering and how well
          const answerQuality = await this.ai.evaluateAnswer(
            content,
            fullResponse,
            session.subject?.name ?? 'General',
          );

          // Only update mastery if the student was attempting an answer
          if (answerQuality !== 'NOT_ANSWER') {
            const wasSuccessful = answerQuality === 'CORRECT';
            // PARTIAL counts the attempt (questionsAsked++) but not correct
            const updated = await this.progress.updateTopicMastery(
              req.user.sub,
              topicId,
              wasSuccessful,
            );
            masteryUpdate = {
              topicId,
              masteryLevel: updated.masteryLevel,
              answerQuality,
            };
          }
        }
      }

      res.write(
        `data: ${JSON.stringify({ type: 'done', metadata, masteryUpdate })}\n\n`,
      );

      // Save complete AI response
      const tokenUsage = await stream.usage;
      const ragSourceIds = (metadata?.ragSources as Array<{ chunkId: string }> | undefined)?.map((r) => r.chunkId);
      await this.chat.saveMessage(sessionId, 'assistant', fullResponse, {
        hintLevel: dbHintLevel,
        modelUsed: metadata?.provider as string | undefined,
        ragSources: ragSourceIds,
        tokensUsed: tokenUsage?.totalTokens,
        wasRedirected: metadata?.wasRedirected as boolean | undefined,
        safeCategory: metadata?.safeCategory as unknown as import('@linhiq/database').TopicCategory | undefined,
      });
    } catch (error) {
      this.logger.error('LLM Stream Error:', error);
      res.write(
        `data: ${JSON.stringify({ type: 'error', message: 'Stream failed' })}\n\n`,
      );
    } finally {
      res.end();
    }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      if (!res.headersSent) {
        const isDev = process.env.NODE_ENV !== 'production';
        res.status(500).json({
          error: message,
          ...(isDev && e instanceof Error && { stack: e.stack }),
        });
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message })}\n\n`);
        res.end();
      }
    }
  }

  // ── F8: Analytics ──────────────────────────────

  @Post('analytics/flush')
  @UseGuards(AuthGuard)
  async flushAnalytics() {
    return this.chat.flushWeeklyStats();
  }

  @Get('analytics/weekly')
  @UseGuards(AuthGuard)
  async getWeeklyStats(@Req() req: RequestWithUser) {
    const userId = req.user.sub;
    return this.chat.getWeeklyStats(userId);
  }
}
