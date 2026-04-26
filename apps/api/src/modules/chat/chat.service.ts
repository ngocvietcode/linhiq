import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationService } from '../notification/notification.service';
import { ChatMode, HintLevel, TopicCategory } from '@linhiq/database';

const CONCERNING_CATEGORIES: TopicCategory[] = [
  'EMOTIONAL',
  'MATURE_SOFT',
  'AGE_BOUNDARY',
  'HARMFUL',
];

@Injectable()
export class ChatService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notifications: NotificationService,
  ) {}

  async createSession(userId: string, subjectId?: string) {
    if (subjectId) {
      const subject = await this.db.subject.findUnique({ where: { id: subjectId } });
      if (!subject) throw new NotFoundException('Subject not found');

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
          take: 50, // Limit to last 50 messages for performance
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

      if (CONCERNING_CATEGORIES.includes(category)) {
        const session = await this.db.chatSession.findUnique({
          where: { id: sessionId },
          select: { userId: true },
        });
        if (session) {
          const childName = await this.db.user
            .findUnique({ where: { id: session.userId }, select: { name: true } })
            .then((u) => u?.name ?? 'Học sinh');
          this.notifications
            .notifyParents(session.userId, {
              type: 'warning',
              title: `${childName} có nội dung chat cần chú ý`,
              body: `Loại: ${category}. Hãy xem nhanh để hỗ trợ con kịp thời.`,
              link: `/parent/children/${session.userId}/alerts`,
            })
            .catch(() => {});
        }
      }
      
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

  /**
   * F8: Flush SessionTopicStat → WeeklyTopicStat (aggregate, anonymous)
   * Should be called periodically (e.g. daily cron or on session end)
   */
  async flushWeeklyStats(): Promise<{ flushed: number }> {
    // Get Monday of current week
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    // Get all session stats with their session's userId
    const sessionStats = await this.db.sessionTopicStat.findMany({
      include: { session: { select: { userId: true } } },
    });

    if (sessionStats.length === 0) return { flushed: 0 };

    // Group by userId and aggregate
    const userAgg: Record<string, { academic: number; general: number; hobbies: number; life: number; redirected: number; totalMsg: number }> = {};

    for (const stat of sessionStats) {
      const uid = stat.session.userId;
      if (!userAgg[uid]) {
        userAgg[uid] = { academic: 0, general: 0, hobbies: 0, life: 0, redirected: 0, totalMsg: 0 };
      }
      userAgg[uid].academic += stat.academic;
      userAgg[uid].general += stat.general;
      userAgg[uid].hobbies += stat.hobbies;
      userAgg[uid].life += stat.life;
      userAgg[uid].redirected += stat.redirected;
      userAgg[uid].totalMsg += stat.totalMsg;
    }

    // Upsert into WeeklyTopicStat
    for (const [userId, counts] of Object.entries(userAgg)) {
      await this.db.weeklyTopicStat.upsert({
        where: { userId_weekStart: { userId, weekStart } },
        update: {
          academic: { increment: counts.academic },
          general: { increment: counts.general },
          hobbies: { increment: counts.hobbies },
          life: { increment: counts.life },
          redirected: { increment: counts.redirected },
          totalMsg: { increment: counts.totalMsg },
        },
        create: {
          userId,
          weekStart,
          ...counts,
        },
      });
    }

    // Clear flushed session stats
    await this.db.sessionTopicStat.deleteMany({
      where: { id: { in: sessionStats.map((s) => s.id) } },
    });

    return { flushed: sessionStats.length };
  }

  /**
   * Get weekly topic stats for a user (used by parent dashboard F7)
   */
  async getWeeklyStats(userId: string, weeks = 4) {
    return this.db.weeklyTopicStat.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      take: weeks,
    });
  }
}
