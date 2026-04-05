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
}
