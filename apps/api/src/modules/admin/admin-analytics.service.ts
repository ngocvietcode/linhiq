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
  /**
   * Token usage and estimated cost by model over a period. Costs are rough
   * estimates per 1K tokens — used for trend monitoring, not billing.
   */
  async tokens(period: Period = '7d') {
    const since = periodStart(period);
    const where = since
      ? { createdAt: { gte: since }, tokensUsed: { not: null }, modelUsed: { not: null } }
      : { tokensUsed: { not: null }, modelUsed: { not: null } };

    const grouped = await this.db.chatMessage.groupBy({
      by: ['modelUsed'],
      where,
      _sum: { tokensUsed: true },
      _count: { _all: true },
    });

    // Rough USD-per-1K-token figures (input+output blended). Adjust as
    // pricing changes — the goal is an order-of-magnitude trend, not invoicing.
    const COST_PER_1K: Record<string, number> = {
      'gemini-2.5-flash': 0.00075,
      'gemini-2.5-pro': 0.0125,
      'gemini-embedding-001': 0.000025,
    };

    const byModel = grouped
      .filter((g) => g.modelUsed)
      .map((g) => {
        const tokens = g._sum.tokensUsed ?? 0;
        const cost = (tokens / 1000) * (COST_PER_1K[g.modelUsed!] ?? 0);
        return {
          model: g.modelUsed!,
          messages: g._count._all,
          tokens,
          estCostUsd: Number(cost.toFixed(4)),
        };
      })
      .sort((a, b) => b.tokens - a.tokens);

    const totalTokens = byModel.reduce((s, m) => s + m.tokens, 0);
    const totalCostUsd = Number(byModel.reduce((s, m) => s + m.estCostUsd, 0).toFixed(4));

    return { period, totalTokens, totalCostUsd, byModel };
  }

  /**
   * Safety signals: comparison of redirected/harmful messages this week vs
   * prior week, plus a category breakdown over the last 7 days. Used to flag
   * when something starts going wrong without waiting for a human report.
   */
  async safety() {
    const now = new Date();
    const sevenAgo = new Date(now);
    sevenAgo.setDate(sevenAgo.getDate() - 7);
    sevenAgo.setHours(0, 0, 0, 0);
    const fourteenAgo = new Date(sevenAgo);
    fourteenAgo.setDate(fourteenAgo.getDate() - 7);

    const [
      recentTotal,
      recentRedirected,
      priorTotal,
      priorRedirected,
      categoryBreakdown,
    ] = await Promise.all([
      this.db.chatMessage.count({
        where: { role: 'user', createdAt: { gte: sevenAgo } },
      }),
      this.db.chatMessage.count({
        where: { role: 'user', createdAt: { gte: sevenAgo }, wasRedirected: true },
      }),
      this.db.chatMessage.count({
        where: { role: 'user', createdAt: { gte: fourteenAgo, lt: sevenAgo } },
      }),
      this.db.chatMessage.count({
        where: {
          role: 'user',
          createdAt: { gte: fourteenAgo, lt: sevenAgo },
          wasRedirected: true,
        },
      }),
      this.db.chatMessage.groupBy({
        by: ['safeCategory'],
        where: {
          role: 'user',
          createdAt: { gte: sevenAgo },
          safeCategory: { not: null },
        },
        _count: { _all: true },
      }),
    ]);

    const recentRatio = recentTotal > 0 ? recentRedirected / recentTotal : 0;
    const priorRatio = priorTotal > 0 ? priorRedirected / priorTotal : 0;
    const ratioDelta = recentRatio - priorRatio;

    // Concerning content categories — `harmful`, `mature`, `age-boundary` per
    // TopicCategory enum. Other categories are not safety signals.
    const concerning = ['harmful', 'mature', 'age-boundary'];
    const categories = categoryBreakdown.map((g) => ({
      category: g.safeCategory as string,
      count: g._count._all,
      concerning: concerning.includes(g.safeCategory as string),
    }));
    const concerningCount = categories
      .filter((c) => c.concerning)
      .reduce((s, c) => s + c.count, 0);

    // Alert when redirected ratio jumps >50% relative AND >2% absolute
    const alertRedirectedSpike =
      priorRatio > 0 && ratioDelta > 0.02 && recentRatio / priorRatio > 1.5;
    // Alert if any concerning content appears at all this week
    const alertConcerningContent = concerningCount > 0;

    return {
      window: { recentStart: sevenAgo, priorStart: fourteenAgo },
      recent: { total: recentTotal, redirected: recentRedirected, ratio: recentRatio },
      prior: { total: priorTotal, redirected: priorRedirected, ratio: priorRatio },
      ratioDelta,
      categories,
      concerningCount,
      alerts: {
        redirectedSpike: alertRedirectedSpike,
        concerningContent: alertConcerningContent,
      },
    };
  }

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
