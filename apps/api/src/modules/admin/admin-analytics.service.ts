import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

type Period = '7d' | '30d' | 'all';

function periodStart(period: Period): Date | null {
  if (period === 'all') return null;
  const days = period === '7d' ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Platform-wide metrics for the admin analytics page. Replaces the mock
   * numbers that the UI was generating client-side.
   */
  async overview(period: Period = '7d') {
    const since = periodStart(period);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const whereSession = since ? { createdAt: { gte: since } } : {};
    const whereMessage = since ? { createdAt: { gte: since } } : {};

    const [
      totalUsers,
      totalSessions,
      totalSubjects,
      activeUsersToday,
      messagesCount,
      sessionsInPeriod,
      subjectBreakdown,
      avgMessagesPerSessionRows,
      hintAgg,
      returnRate7d,
    ] = await Promise.all([
      this.db.user.count({ where: { role: 'STUDENT', isActive: true } }),
      this.db.chatSession.count({ where: whereSession }),
      this.db.subject.count({ where: { isActive: true } }),
      this.db.user.count({
        where: {
          chatSessions: { some: { updatedAt: { gte: startOfToday } } },
        },
      }),
      this.db.chatMessage.count({ where: whereMessage }),
      this.db.chatSession.findMany({
        where: whereSession,
        select: { createdAt: true, subjectId: true, _count: { select: { messages: true } } },
      }),
      this.db.chatSession.groupBy({
        by: ['subjectId'],
        where: whereSession,
        _count: { _all: true },
      }),
      this.db.chatSession.findMany({
        where: whereSession,
        select: { _count: { select: { messages: true } } },
      }),
      this.db.chatMessage.groupBy({
        by: ['hintLevel'],
        where: { ...whereMessage, role: 'assistant', hintLevel: { not: null } },
        _count: { _all: true },
      }),
      this.computeReturnRate(sevenDaysAgo),
    ]);

    // Weekly activity — last 7 days, grouped by local date
    const weeklyData = this.bucketByDay(sessionsInPeriod, 7);

    // Subject stats → resolve names
    const subjectIds = subjectBreakdown.map((s) => s.subjectId).filter((v): v is string => !!v);
    const subjectRows = subjectIds.length
      ? await this.db.subject.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, name: true, iconEmoji: true },
        })
      : [];
    const byId = new Map(subjectRows.map((s) => [s.id, s]));
    const subjectTotal = subjectBreakdown.reduce((sum, s) => sum + s._count._all, 0) || 1;
    const subjectStats = subjectBreakdown
      .filter((s) => s.subjectId)
      .map((s) => {
        const sub = byId.get(s.subjectId!);
        return {
          subjectId: s.subjectId!,
          name: sub?.name ?? 'Unknown',
          emoji: sub?.iconEmoji ?? '📚',
          sessions: s._count._all,
          pct: Math.round((s._count._all / subjectTotal) * 100),
        };
      })
      .sort((a, b) => b.sessions - a.sessions);

    // Derived metrics
    const sessionCount = avgMessagesPerSessionRows.length || 1;
    const msgPerSession = avgMessagesPerSessionRows.reduce((s, r) => s + r._count.messages, 0) / sessionCount;

    const hintMap: Record<string, number> = { L1: 1, L2: 2, L3: 3, L4: 4, L5: 5 };
    const hintNumerator = hintAgg.reduce(
      (sum, h) => sum + hintMap[h.hintLevel as string] * h._count._all,
      0,
    );
    const hintDenominator = hintAgg.reduce((sum, h) => sum + h._count._all, 0) || 1;
    const avgHintLevel = hintNumerator / hintDenominator;

    // Avg session length — derived from StudySession
    const studyAgg = await this.db.studySession.aggregate({
      where: since ? { date: { gte: since } } : {},
      _avg: { durationMin: true },
    });

    return {
      period,
      totalUsers,
      totalSessions,
      totalSubjects,
      activeUsersToday,
      totalMessages: messagesCount,
      avgSessionMin: Math.round(studyAgg._avg.durationMin ?? 0),
      weeklyData,
      subjectStats,
      engagement: {
        messagesPerSession: Number(msgPerSession.toFixed(1)),
        avgHintLevel: Number(avgHintLevel.toFixed(1)),
        returnRate7d,
      },
    };
  }

  /**
   * Platform-wide chat-category distribution (academic / general / hobbies /
   * life / redirected). Aggregates WeeklyTopicStat + live SessionTopicStat
   * so admins see the same numbers the chat pipeline records.
   */
  async chatCategories() {
    const [weekly, live] = await Promise.all([
      this.db.weeklyTopicStat.aggregate({
        _sum: {
          academic: true,
          general: true,
          hobbies: true,
          life: true,
          redirected: true,
          totalMsg: true,
        },
      }),
      this.db.sessionTopicStat.aggregate({
        _sum: {
          academic: true,
          general: true,
          hobbies: true,
          life: true,
          redirected: true,
          totalMsg: true,
        },
      }),
    ]);

    const pick = (k: 'academic' | 'general' | 'hobbies' | 'life' | 'redirected' | 'totalMsg') =>
      (weekly._sum[k] ?? 0) + (live._sum[k] ?? 0);

    const totals = {
      academic: pick('academic'),
      general: pick('general'),
      hobbies: pick('hobbies'),
      life: pick('life'),
      redirected: pick('redirected'),
      totalMsg: pick('totalMsg'),
    };
    const total = totals.totalMsg || 1;

    return {
      totals,
      ratios: {
        academic: totals.academic / total,
        general: totals.general / total,
        hobbies: totals.hobbies / total,
        life: totals.life / total,
        redirected: totals.redirected / total,
      },
    };
  }

  private bucketByDay(
    rows: Array<{ createdAt: Date; _count: { messages: number } }>,
    days: number,
  ) {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(end.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const result: { day: string; date: string; sessions: number; messages: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      result.push({
        day: labels[d.getDay()],
        date: d.toISOString().slice(0, 10),
        sessions: 0,
        messages: 0,
      });
    }
    const indexByDate = new Map(result.map((r, i) => [r.date, i]));
    for (const row of rows) {
      const key = new Date(row.createdAt).toISOString().slice(0, 10);
      const idx = indexByDate.get(key);
      if (idx !== undefined) {
        result[idx].sessions += 1;
        result[idx].messages += row._count.messages;
      }
    }
    return result;
  }

  private async computeReturnRate(sevenDaysAgo: Date): Promise<number> {
    const fourteenDaysAgo = new Date(sevenDaysAgo);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 7);

    const [priorActive, returned] = await Promise.all([
      this.db.chatSession.findMany({
        where: { createdAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo } },
        distinct: ['userId'],
        select: { userId: true },
      }),
      this.db.chatSession.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        distinct: ['userId'],
        select: { userId: true },
      }),
    ]);

    if (priorActive.length === 0) return 0;
    const priorSet = new Set(priorActive.map((r) => r.userId));
    const returnedCount = returned.filter((r) => priorSet.has(r.userId)).length;
    return returnedCount / priorActive.length;
  }
}
