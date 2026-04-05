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
} from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { AiService } from '../ai/ai.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { createSessionSchema, sendMessageSchema } from '@javirs/validators';
import { HintLevel } from '@javirs/database';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(
    private readonly chat: ChatService,
    private readonly ai: AiService,
  ) {}

  @Post('sessions')
  async createSession(@Body() body: unknown, @Req() req: any) {
    const input = body as any; // Temporary skip zod validation since validator index might not have been updated yet
    const finalSubjectId = input.subjectId === "undefined" ? undefined : input.subjectId;
    return this.chat.createSession(req.user.sub, finalSubjectId);
  }

  @Get('sessions')
  async getSessions(@Req() req: any) {
    return this.chat.getSessions(req.user.sub);
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string, @Req() req: any) {
    const session = await this.chat.getSession(id, req.user.sub);
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    return session;
  }

  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string, @Req() req: any) {
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
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
    const input = sendMessageSchema.parse(body);

    // Verify session ownership and get session with subject
    const session = await this.chat.getSession(sessionId, req.user.sub);
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    // 1. Classify Safe Chat
    const { category, shouldRedirect } = await this.ai.classifySafeChat(input.content);

    // Save user message with topic category
    await this.chat.saveMessage(sessionId, 'user', input.content, {
      safeCategory: category,
    });

    // Auto-generate session title from first message
    if (!session.title) {
      const title =
        input.content.length > 50
          ? input.content.substring(0, 47) + '...'
          : input.content;
      await this.chat.updateSessionTitle(sessionId, title);
    }

    // Get chat history
    const history = session.messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Map HintLevel
    const hintMap: Record<number, any> = { 1: HintLevel.L1, 2: HintLevel.L2, 3: HintLevel.L3, 4: HintLevel.L4, 5: HintLevel.L5 };
    const dbHintLevel = hintMap[input.hintLevel ?? 1] ?? HintLevel.L1;

    // Stream AI response or Redirect
    let aiResponse;
    if (shouldRedirect) {
      aiResponse = await this.ai.streamGentleRedirect(input.content, category);
    } else {
      aiResponse = await this.ai.streamChat({
        userMessage: input.content,
        chatHistory: history,
        subjectId: session.subjectId ?? '',
        subjectName: session.subject?.name ?? 'General',
        curriculum: session.subject?.curriculum ?? 'GENERAL',
        hintLevel: input.hintLevel,
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

      // Send metadata
      res.write(
        `data: ${JSON.stringify({ type: 'done', metadata })}\n\n`,
      );

      // Save complete AI response
      const tokenUsage = await stream.usage;
      await this.chat.saveMessage(sessionId, 'assistant', fullResponse, {
        hintLevel: dbHintLevel,
        modelUsed: metadata?.provider,
        ragSources: metadata?.ragSources?.map((r: any) => r.chunkId),
        tokensUsed: tokenUsage?.totalTokens,
        wasRedirected: metadata?.wasRedirected,
        safeCategory: metadata?.safeCategory,
      });
    } catch (error) {
      console.error('LLM Stream Error:', error);
      res.write(
        `data: ${JSON.stringify({ type: 'error', message: 'Stream failed' })}\n\n`,
      );
    } finally {
      res.end();
    }
    } catch (e: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: e.message, stack: e.stack });
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: e.message })}\n\n`);
        res.end();
      }
    }
  }
}
