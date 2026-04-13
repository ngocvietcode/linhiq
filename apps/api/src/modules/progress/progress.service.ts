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
    const studyTimeMin = studySessions.reduce((sum, s) => sum + s.durationMin, 0);

    const subjects = await this.db.subject.findMany({
      include: {
        topics: {
          include: {
            progress: {
              where: { userId },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    const subjectProgress = subjects.map((subject) => ({
      ...subject,
      totalTopics: subject.topics.length,
      masteredTopics: subject.topics.filter(
        (t) => t.progress.some((p) => p.masteryLevel >= 0.8),
      ).length,
      overallMastery:
        subject.topics.length > 0
          ? subject.topics.reduce(
              (sum, t) => sum + (t.progress[0]?.masteryLevel || 0),
              0,
            ) / subject.topics.length
          : 0,
    }));

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
