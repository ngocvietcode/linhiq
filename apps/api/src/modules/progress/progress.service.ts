import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProgressService {
  constructor(private readonly db: DatabaseService) {}

  async getSubjects() {
    return this.db.subject.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getOverview(userId: string) {
    let profile = await this.db.studentProfile.findUnique({ where: { userId }});
    if (!profile) {
      try {
        profile = await this.db.studentProfile.create({
          data: { userId, streakDays: 0 }
        });
      } catch (e) {
        // Handle concurrent creation
        profile = await this.db.studentProfile.findUnique({ where: { userId }});
      }
    }

    const studySessions = await this.db.studySession.findMany({ where: { userId }});
    const studyTimeMin = studySessions.reduce((sum: number, s: any) => sum + s.durationMin, 0);

    const subjects = await this.db.subject.findMany({
      include: {
        Unit: {
          include: {
            Topic: {
              include: {
                progress: {
                  where: { userId },
                },
              },
              orderBy: { orderIndex: 'asc' },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    const subjectProgress = subjects.map((subject) => {
      const allTopics = subject.Unit.flatMap(u => u.Topic);
      return {
        ...subject,
        totalTopics: allTopics.length,
        masteredTopics: allTopics.filter(
          (t) => t.progress.some((p) => p.masteryLevel >= 0.8),
        ).length,
        overallMastery:
          allTopics.length > 0
            ? allTopics.reduce(
                (sum: number, t: any) => sum + (t.progress[0]?.masteryLevel || 0),
                0,
              ) / allTopics.length
            : 0,
      };
    });

    return {
      streakDays: profile?.streakDays || 0,
      studyTimeMin,
      subjects: subjectProgress
    };
  }

  /**
   * Update TopicProgress after a chat exchange.
   *
   * Mastery formula (confidence-weighted):
   *   accuracy   = correctAnswers / questionsAsked        (quality: how often right)
   *   confidence = min(1, questionsAsked / MIN_QUESTIONS) (quantity: enough data?)
   *   mastery    = accuracy × confidence
   *
   * This ensures 1 correct answer → ~20% (not 100%).
   * Needs MIN_QUESTIONS correct answers to reach Excellent (80%+).
   *
   * wasSuccessful heuristic:
   *   true  → student used hintLevel ≤2 (answered mostly independently)
   *   false → student used hintLevel ≥4 (needed heavy guidance)
   *   neutral (hintLevel 3) → treated as partial — not counted as correct
   */
  async updateTopicMastery(
    userId: string,
    topicId: string,
    wasSuccessful: boolean,
    weight = 1,   // weight=1 for chat, weight=2 for quiz (deliberate assessment)
  ) {
    // Minimum number of questions before mastery can reach 100%
    const MIN_QUESTIONS = 5;

    const existing = await this.db.topicProgress.findUnique({
      where: { userId_topicId: { userId, topicId } },
    });

    const questionsAsked = (existing?.questionsAsked ?? 0) + weight;
    const correctAnswers = (existing?.correctAnswers ?? 0) + (wasSuccessful ? weight : 0);

    // confidence: scales from 0 → 1 as weighted questionsAsked grows toward MIN_QUESTIONS
    const confidence = Math.min(1.0, questionsAsked / MIN_QUESTIONS);
    const accuracy = correctAnswers / questionsAsked;
    const masteryLevel = Math.min(1.0, Math.max(0, accuracy * confidence));

    return this.db.topicProgress.upsert({
      where: { userId_topicId: { userId, topicId } },
      update: {
        questionsAsked: { increment: weight },
        ...(wasSuccessful && { correctAnswers: { increment: weight } }),
        masteryLevel,
        lastStudiedAt: new Date(),
      },
      create: {
        userId,
        topicId,
        questionsAsked: weight,
        correctAnswers: wasSuccessful ? weight : 0,
        masteryLevel,
        lastStudiedAt: new Date(),
      },
    });
  }

  /**
   * Aggregate chat-category message counts for a student.
   * Combines the current week's live SessionTopicStat rows with the last N
   * flushed WeeklyTopicStat rows so the student always sees up-to-date
   * category ratios (academic / general / hobbies / life / redirected).
   */
  async getChatCategoryStats(userId: string, weeks = 4) {
    const [weekly, liveStats] = await Promise.all([
      this.db.weeklyTopicStat.findMany({
        where: { userId },
        orderBy: { weekStart: 'desc' },
        take: weeks,
      }),
      this.db.sessionTopicStat.findMany({
        where: { session: { userId } },
        select: {
          academic: true,
          general: true,
          hobbies: true,
          life: true,
          redirected: true,
          totalMsg: true,
        },
      }),
    ]);

    const totals = { academic: 0, general: 0, hobbies: 0, life: 0, redirected: 0, totalMsg: 0 };
    for (const w of weekly) {
      totals.academic += w.academic;
      totals.general += w.general;
      totals.hobbies += w.hobbies;
      totals.life += w.life;
      totals.redirected += w.redirected;
      totals.totalMsg += w.totalMsg;
    }
    for (const s of liveStats) {
      totals.academic += s.academic;
      totals.general += s.general;
      totals.hobbies += s.hobbies;
      totals.life += s.life;
      totals.redirected += s.redirected;
      totals.totalMsg += s.totalMsg;
    }

    const safeDiv = (n: number) => (totals.totalMsg ? n / totals.totalMsg : 0);

    return {
      totals,
      ratios: {
        academic: safeDiv(totals.academic),
        general: safeDiv(totals.general),
        hobbies: safeDiv(totals.hobbies),
        life: safeDiv(totals.life),
        redirected: safeDiv(totals.redirected),
      },
      weekly: weekly.map((w) => ({
        weekStart: w.weekStart,
        academic: w.academic,
        general: w.general,
        hobbies: w.hobbies,
        life: w.life,
        redirected: w.redirected,
        totalMsg: w.totalMsg,
      })),
    };
  }

  /**
   * Study minutes per day for the last `days` days (today inclusive).
   * Fills zero-value days so the caller can render a continuous chart.
   */
  async getStudyHoursByDay(userId: string, days = 7) {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const sessions = await this.db.studySession.findMany({
      where: { userId, date: { gte: start, lte: end } },
      select: { date: true, durationMin: true, subjectId: true },
    });

    const buckets: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      buckets[d.toISOString().slice(0, 10)] = 0;
    }
    for (const s of sessions) {
      const key = new Date(s.date).toISOString().slice(0, 10);
      if (key in buckets) buckets[key] += s.durationMin;
    }

    return Object.entries(buckets).map(([date, minutes]) => ({ date, minutes }));
  }

  /**
   * Aggregate study minutes per subject over the lifetime of the account.
   */
  async getStudyTimeBySubject(userId: string) {
    const grouped = await this.db.studySession.groupBy({
      by: ['subjectId'],
      where: { userId, subjectId: { not: null } },
      _sum: { durationMin: true },
    });

    const subjectIds = grouped.map((g) => g.subjectId!).filter(Boolean);
    if (subjectIds.length === 0) return [];

    const subjects = await this.db.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true, iconEmoji: true },
    });
    const byId = new Map(subjects.map((s) => [s.id, s]));

    return grouped
      .map((g) => {
        const s = byId.get(g.subjectId!);
        return {
          subjectId: g.subjectId!,
          name: s?.name ?? 'Unknown',
          iconEmoji: s?.iconEmoji ?? '📚',
          minutes: g._sum.durationMin ?? 0,
        };
      })
      .sort((a, b) => b.minutes - a.minutes);
  }

  /**
   * Count user messages this week, and mastery-based accuracy.
   * Used by parent overview ("questions asked", "accuracy").
   */
  async getQuestionsAndAccuracy(userId: string) {
    // Start of ISO week (Monday)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);

    const [questionsThisWeek, mastery] = await Promise.all([
      this.db.chatMessage.count({
        where: {
          role: 'user',
          createdAt: { gte: weekStart },
          session: { userId },
        },
      }),
      this.db.topicProgress.aggregate({
        where: { userId },
        _sum: { questionsAsked: true, correctAnswers: true },
      }),
    ]);

    const asked = mastery._sum.questionsAsked ?? 0;
    const correct = mastery._sum.correctAnswers ?? 0;
    const accuracy = asked > 0 ? correct / asked : 0;

    return { questionsThisWeek, totalAsked: asked, totalCorrect: correct, accuracy };
  }

  /**
   * Get the topicId most associated with a set of RAG chunk IDs.
   * Used by ChatController to link a chat exchange to a curriculum topic.
   */
  async getTopicIdFromChunks(chunkIds: string[]): Promise<string | null> {
    if (!chunkIds || chunkIds.length === 0) return null;

    const chunks = await this.db.documentChunk.findMany({
      where: { id: { in: chunkIds }, topicId: { not: null } },
      select: { topicId: true },
    });

    if (chunks.length === 0) return null;

    // Pick the most frequently referenced topicId among the RAG sources
    const freq: Record<string, number> = {};
    for (const c of chunks) {
      if (c.topicId) freq[c.topicId] = (freq[c.topicId] ?? 0) + 1;
    }
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }
}
