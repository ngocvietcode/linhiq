import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export type MasteryTier = 'not_started' | 'average' | 'good' | 'excellent';

function toMasteryTier(level: number): MasteryTier {
  if (level >= 0.8) return 'excellent';
  if (level >= 0.5) return 'good';
  if (level > 0)   return 'average';
  return 'not_started';
}

@Injectable()
export class SubjectService {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.subject.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getRoadmap(subjectId: string) {
    const subject = await this.db.subject.findUnique({
      where: { id: subjectId },
      include: {
        Unit: {
          orderBy: { orderIndex: 'asc' },
          include: {
            Topic: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!subject) throw new NotFoundException('Subject not found');
    return subject.Unit;
  }

  /**
   * GET /subjects/:id/roadmap-mastery
   * Returns the full Milestone → Topic tree enriched with the user's mastery data.
   */
  async getRoadmapWithMastery(subjectId: string, userId: string) {
    const subject = await this.db.subject.findUnique({
      where: { id: subjectId },
      include: {
        Unit: {
          orderBy: { orderIndex: 'asc' },
          include: {
            Topic: {
              orderBy: { orderIndex: 'asc' },
              include: {
                progress: { where: { userId } },
              },
            },
          },
        },
      },
    });

    if (!subject) throw new NotFoundException('Subject not found');

    return subject.Unit.map((unit) => {
      const topics = unit.Topic.map((topic) => {
        const prog = topic.progress[0];
        const masteryLevel = prog?.masteryLevel ?? 0;
        return {
          id: topic.id,
          name: topic.name,
          nameVi: topic.nameVi,
          orderIndex: topic.orderIndex,
          masteryLevel,
          masteryTier: toMasteryTier(masteryLevel),
          questionsAsked: prog?.questionsAsked ?? 0,
          correctAnswers: prog?.correctAnswers ?? 0,
          lastStudiedAt: prog?.lastStudiedAt ?? null,
        };
      });

      const totalTopics = topics.length;
      const completedTopics = topics.filter((t) => t.masteryLevel >= 0.5).length;
      const milestoneMastery =
        totalTopics > 0
          ? topics.reduce((sum: number, t) => sum + t.masteryLevel, 0) / totalTopics
          : 0;

      return {
        id: unit.id,
        name: unit.name,
        description: unit.description,
        orderIndex: unit.orderIndex,
        milestoneMastery,
        completedTopics,
        totalTopics,
        topics,
      };
    });
  }
}
