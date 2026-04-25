import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class ParentService {
  constructor(
    private readonly db: DatabaseService,
    private readonly progress: ProgressService,
  ) {}

  /**
   * List children linked to a parent account. Returns lightweight profile
   * info used by the parent dashboard to pick a child.
   */
  async listChildren(parentId: string) {
    const links = await this.db.parentChild.findMany({
      where: { parentId },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            studentProfile: {
              select: {
                curriculum: true,
                streakDays: true,
                lastStudyAt: true,
              },
            },
          },
        },
      },
      orderBy: { linkedAt: 'asc' },
    });

    return links.map((l) => ({
      id: l.child.id,
      name: l.child.name,
      email: l.child.email,
      avatarUrl: l.child.avatarUrl,
      curriculum: l.child.studentProfile?.curriculum ?? null,
      streakDays: l.child.studentProfile?.streakDays ?? 0,
      lastStudyAt: l.child.studentProfile?.lastStudyAt ?? null,
    }));
  }

  /**
   * Ensure the parent really is linked to this child.
   * Throws 403 if not — prevents one parent from snooping on another's child.
   */
  private async assertLinked(parentId: string, childId: string) {
    const link = await this.db.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });
    if (!link) throw new ForbiddenException('Not linked to this student');
  }

  async getChildOverview(parentId: string, childId: string) {
    await this.assertLinked(parentId, childId);

    const [overview, summary, chatStats, studyHours, studyBySubject] = await Promise.all([
      this.progress.getOverview(childId),
      this.progress.getQuestionsAndAccuracy(childId),
      this.progress.getChatCategoryStats(childId, 4),
      this.progress.getStudyHoursByDay(childId, 7),
      this.progress.getStudyTimeBySubject(childId),
    ]);

    const child = await this.db.user.findUnique({
      where: { id: childId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        studentProfile: { select: { curriculum: true } },
      },
    });
    if (!child) throw new NotFoundException('Student not found');

    return {
      child: {
        id: child.id,
        name: child.name,
        email: child.email,
        avatarUrl: child.avatarUrl,
        curriculum: child.studentProfile?.curriculum ?? null,
      },
      overview,
      summary,
      chatStats,
      studyHours,
      studyBySubject,
    };
  }

  /**
   * Weekly report: focused on last 7 days of activity plus full chat-category
   * distribution and top-studied topics. Used by /parent/reports.
   */
  async getChildReport(parentId: string, childId: string) {
    await this.assertLinked(parentId, childId);

    const [studyHours, studyBySubject, chatStats, summary] = await Promise.all([
      this.progress.getStudyHoursByDay(childId, 7),
      this.progress.getStudyTimeBySubject(childId),
      this.progress.getChatCategoryStats(childId, 1),
      this.progress.getQuestionsAndAccuracy(childId),
    ]);

    // Top topics by questionsAsked (proxy for "studied most")
    const topTopics = await this.db.topicProgress.findMany({
      where: { userId: childId },
      orderBy: { questionsAsked: 'desc' },
      take: 6,
      include: {
        topic: {
          select: { name: true, subject: { select: { name: true, iconEmoji: true } } },
        },
      },
    });

    // Strengths / weaknesses based on mastery
    const allProgress = await this.db.topicProgress.findMany({
      where: { userId: childId, questionsAsked: { gt: 0 } },
      include: { topic: { select: { name: true } } },
    });
    const strengths = allProgress
      .filter((p) => p.masteryLevel >= 0.8)
      .sort((a, b) => b.masteryLevel - a.masteryLevel)
      .slice(0, 5)
      .map((p) => p.topic.name);
    const weaknesses = allProgress
      .filter((p) => p.masteryLevel < 0.5 && p.questionsAsked >= 2)
      .sort((a, b) => a.masteryLevel - b.masteryLevel)
      .slice(0, 5)
      .map((p) => ({
        topic: p.topic.name,
        masteryLevel: p.masteryLevel,
        questionsAsked: p.questionsAsked,
      }));

    return {
      studyHours,
      studyBySubject,
      chatStats,
      summary,
      topTopics: topTopics.map((t) => ({
        topicName: t.topic.name,
        subjectName: t.topic.subject.name,
        subjectIcon: t.topic.subject.iconEmoji,
        questionsAsked: t.questionsAsked,
        masteryLevel: t.masteryLevel,
        lastStudiedAt: t.lastStudiedAt,
      })),
      strengths,
      weaknesses,
    };
  }
}
