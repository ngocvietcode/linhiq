import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ChatMode, HintLevel, TopicCategory } from '@javirs/database';

@Injectable()
export class ChatService {
  constructor(private readonly db: DatabaseService) {}

  async createSession(userId: string, subjectId?: string) {
    if (subjectId) {
      return this.db.chatSession.create({
        data: { userId, subjectId, mode: ChatMode.SUBJECT },
        include: { subject: true },
      });
    }
    return this.db.chatSession.create({
      data: { userId, mode: ChatMode.OPEN },
    });
  }

  async getSessions(userId: string) {
    return this.db.chatSession.findMany({
      where: { userId },
      include: {
        subject: true,
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSession(sessionId: string, userId: string) {
    return this.db.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        subject: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async deleteSession(sessionId: string, userId: string) {
    return this.db.chatSession.deleteMany({
      where: { id: sessionId, userId },
    });
  }

  async saveMessage(
    sessionId: string,
    role: string,
    content: string,
    metadata?: {
      hintLevel?: HintLevel;
      tokensUsed?: number;
      modelUsed?: string;
      ragSources?: string[];
      safeCategory?: TopicCategory;
      wasRedirected?: boolean;
    }
  ) {
    const message = await this.db.chatMessage.create({
      data: {
        sessionId,
        role,
        content,
        hintLevel: metadata?.hintLevel,
        tokensUsed: metadata?.tokensUsed,
        modelUsed: metadata?.modelUsed,
        ragSources: metadata?.ragSources,
        safeCategory: metadata?.safeCategory,
        wasRedirected: metadata?.wasRedirected,
      },
    });

    await this.db.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    // Update SessionTopicStat if this is a user message
    if (role === 'user' && metadata?.safeCategory) {
      const category = metadata.safeCategory;
      const isRedirected = category === 'AGE_BOUNDARY' || category === 'HARMFUL';
      
      const updateData: any = { totalMsg: { increment: 1 } };

      if (isRedirected) {
        updateData.redirected = { increment: 1 };
      } else if (category === 'ACADEMIC') {
        updateData.academic = { increment: 1 };
      } else if (category === 'GENERAL') {
        updateData.general = { increment: 1 };
      } else if (category === 'HOBBIES') {
        updateData.hobbies = { increment: 1 };
      } else if (category === 'LIFE' || category === 'EMOTIONAL' || category === 'MATURE_SOFT') {
        updateData.life = { increment: 1 };
      }

      await this.db.sessionTopicStat.upsert({
        where: { sessionId },
        update: updateData,
        create: {
          sessionId,
          academic: category === 'ACADEMIC' ? 1 : 0,
          general: category === 'GENERAL' ? 1 : 0,
          hobbies: category === 'HOBBIES' ? 1 : 0,
          life: (category === 'LIFE' || category === 'EMOTIONAL' || category === 'MATURE_SOFT') ? 1 : 0,
          redirected: isRedirected ? 1 : 0,
          totalMsg: 1,
        }
      });
    }

    return message;
  }

  async updateSessionTitle(sessionId: string, title: string) {
    return this.db.chatSession.update({
      where: { id: sessionId },
      data: { title },
    });
  }
}
