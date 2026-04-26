import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { DatabaseService } from '../database/database.service';
import { ProgressService } from '../progress/progress.service';
import { NotificationService } from '../notification/notification.service';
import type { TopicCategory, Curriculum } from '@linhiq/database';

const LINK_REQUEST_TTL_HOURS = 24;
const LINK_REQUEST_MAX_PER_PARENT = 5;

const CONCERNING_CATEGORIES: TopicCategory[] = [
  'EMOTIONAL',
  'MATURE_SOFT',
  'AGE_BOUNDARY',
  'HARMFUL',
];

function clampDays(days: number | undefined, def = 7, max = 90) {
  const n = Math.round(Number(days ?? def));
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(max, Math.max(1, n));
}

@Injectable()
export class ParentService {
  constructor(
    private readonly db: DatabaseService,
    private readonly progress: ProgressService,
    private readonly notifications: NotificationService,
  ) {}

  async listChildren(parentId: string) {
    const links = await this.db.parentChild.findMany({
      where: { parentId },
      include: {
        child: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatarUrl: true,
            studentProfile: {
              select: {
                curriculum: true,
                streakDays: true,
                lastStudyAt: true,
                studyGoal: true,
              },
            },
          },
        },
      },
      orderBy: { linkedAt: 'asc' },
    });

    const now = Date.now();
    return links.map((l) => {
      const last = l.child.studentProfile?.lastStudyAt;
      const daysSinceLastStudy = last
        ? Math.floor((now - new Date(last).getTime()) / (24 * 60 * 60 * 1000))
        : null;
      return {
        id: l.child.id,
        name: l.child.name,
        email: l.child.email,
        username: l.child.username,
        avatarUrl: l.child.avatarUrl,
        curriculum: l.child.studentProfile?.curriculum ?? null,
        streakDays: l.child.studentProfile?.streakDays ?? 0,
        lastStudyAt: l.child.studentProfile?.lastStudyAt ?? null,
        studyGoal: l.child.studentProfile?.studyGoal ?? 60,
        daysSinceLastStudy,
        inactive: daysSinceLastStudy !== null && daysSinceLastStudy >= 3,
      };
    });
  }

  /** Verify parent ↔ child link (403 otherwise). */
  private async assertLinked(parentId: string, childId: string) {
    const link = await this.db.parentChild.findUnique({
      where: { parentId_childId: { parentId, childId } },
    });
    if (!link) throw new ForbiddenException('Not linked to this student');
  }

  async getChildOverview(parentId: string, childId: string, daysParam?: number) {
    await this.assertLinked(parentId, childId);
    const days = clampDays(daysParam, 7, 90);

    const [overview, summary, chatStats, studyHours, studyBySubject] = await Promise.all([
      this.progress.getOverview(childId),
      this.progress.getQuestionsAndAccuracy(childId),
      this.progress.getChatCategoryStats(childId, 4),
      this.progress.getStudyHoursByDay(childId, days),
      this.progress.getStudyTimeBySubject(childId),
    ]);

    const child = await this.db.user.findUnique({
      where: { id: childId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        studentProfile: { select: { curriculum: true, studyGoal: true, lastStudyAt: true } },
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
        studyGoal: child.studentProfile?.studyGoal ?? 60,
        lastStudyAt: child.studentProfile?.lastStudyAt ?? null,
      },
      overview,
      summary,
      chatStats,
      studyHours,
      studyBySubject,
      days,
    };
  }

  async getChildReport(parentId: string, childId: string, daysParam?: number) {
    await this.assertLinked(parentId, childId);
    const days = clampDays(daysParam, 7, 90);

    const [studyHours, studyBySubject, chatStats, summary] = await Promise.all([
      this.progress.getStudyHoursByDay(childId, days),
      this.progress.getStudyTimeBySubject(childId),
      this.progress.getChatCategoryStats(childId, Math.max(1, Math.ceil(days / 7))),
      this.progress.getQuestionsAndAccuracy(childId),
    ]);

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
      days,
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

  /** List the child's chat sessions (parent-readable summary). */
  async listChildSessions(
    parentId: string,
    childId: string,
    opts: { days?: number; onlyConcerning?: boolean; limit?: number } = {},
  ) {
    await this.assertLinked(parentId, childId);
    const days = clampDays(opts.days, 30, 365);
    const limit = Math.min(100, Math.max(1, Math.round(opts.limit ?? 50)));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const sessions = await this.db.chatSession.findMany({
      where: {
        userId: childId,
        updatedAt: { gte: since },
        ...(opts.onlyConcerning
          ? {
              messages: {
                some: {
                  OR: [
                    { wasRedirected: true },
                    { safeCategory: { in: CONCERNING_CATEGORIES } },
                  ],
                },
              },
            }
          : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        subject: { select: { name: true, iconEmoji: true } },
        _count: { select: { messages: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          where: { role: 'user' },
          select: { content: true },
        },
      },
    });

    if (sessions.length === 0) return [];

    const ids = sessions.map((s) => s.id);
    const concerning = await this.db.chatMessage.groupBy({
      by: ['sessionId'],
      where: {
        sessionId: { in: ids },
        OR: [
          { wasRedirected: true },
          { safeCategory: { in: CONCERNING_CATEGORIES } },
        ],
      },
      _count: { _all: true },
    });
    const concerningBySession = new Map(
      concerning.map((c) => [c.sessionId, c._count._all]),
    );

    return sessions.map((s) => ({
      id: s.id,
      title: s.title,
      mode: s.mode,
      subject: s.subject ? { name: s.subject.name, iconEmoji: s.subject.iconEmoji } : null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messageCount: s._count.messages,
      firstUserMessage: s.messages[0]?.content ?? null,
      concerningCount: concerningBySession.get(s.id) ?? 0,
    }));
  }

  /** Read-only transcript of a single session belonging to the linked child. */
  async getChildSession(parentId: string, childId: string, sessionId: string) {
    await this.assertLinked(parentId, childId);
    const session = await this.db.chatSession.findFirst({
      where: { id: sessionId, userId: childId },
      include: {
        subject: { select: { name: true, iconEmoji: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
            safeCategory: true,
            wasRedirected: true,
            hintLevel: true,
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  /** Concerning content feed: redirected + sensitive-category user messages. */
  async getChildAlerts(parentId: string, childId: string, daysParam?: number) {
    await this.assertLinked(parentId, childId);
    const days = clampDays(daysParam, 30, 365);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const messages = await this.db.chatMessage.findMany({
      where: {
        role: 'user',
        createdAt: { gte: since },
        session: { userId: childId },
        OR: [
          { wasRedirected: true },
          { safeCategory: { in: CONCERNING_CATEGORIES } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        sessionId: true,
        content: true,
        createdAt: true,
        safeCategory: true,
        wasRedirected: true,
        session: {
          select: {
            title: true,
            mode: true,
            subject: { select: { name: true, iconEmoji: true } },
          },
        },
      },
    });

    return messages.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      sessionTitle: m.session?.title ?? null,
      sessionMode: m.session?.mode ?? null,
      subject: m.session?.subject
        ? { name: m.session.subject.name, iconEmoji: m.session.subject.iconEmoji }
        : null,
      content: m.content,
      createdAt: m.createdAt,
      category: m.safeCategory,
      wasRedirected: m.wasRedirected,
    }));
  }

  /** Quiz attempts for the child. */
  async getChildQuizzes(parentId: string, childId: string, limitParam?: number) {
    await this.assertLinked(parentId, childId);
    const limit = Math.min(100, Math.max(1, Math.round(limitParam ?? 30)));

    const attempts = await this.db.quizAttempt.findMany({
      where: { userId: childId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        subject: { select: { name: true, iconEmoji: true } },
        topic: { select: { name: true } },
        Unit: { select: { name: true } },
      },
    });

    return attempts.map((a) => ({
      id: a.id,
      quizType: a.quizType,
      score: a.score,
      total: a.total,
      accuracy: a.total > 0 ? a.score / a.total : 0,
      completed: a.completedAt !== null,
      createdAt: a.createdAt,
      completedAt: a.completedAt,
      subject: a.subject ? { name: a.subject.name, iconEmoji: a.subject.iconEmoji } : null,
      topicName: a.topic?.name ?? null,
      unitName: a.Unit?.name ?? null,
    }));
  }

  /** Topic-level breakdown for one subject (drill-down from overview). */
  async getChildSubjectDetail(parentId: string, childId: string, subjectId: string) {
    await this.assertLinked(parentId, childId);

    const subject = await this.db.subject.findUnique({
      where: { id: subjectId },
      select: { id: true, name: true, iconEmoji: true, curriculum: true },
    });
    if (!subject) throw new NotFoundException('Subject not found');

    const units = await this.db.unit.findMany({
      where: { subjectId },
      orderBy: { orderIndex: 'asc' },
      include: {
        Topic: {
          orderBy: { orderIndex: 'asc' },
          include: {
            progress: { where: { userId: childId } },
          },
        },
      },
    });

    const studyMin = await this.db.studySession.aggregate({
      where: { userId: childId, subjectId },
      _sum: { durationMin: true },
    });

    const recentQuizzes = await this.db.quizAttempt.findMany({
      where: { userId: childId, subjectId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { topic: { select: { name: true } }, Unit: { select: { name: true } } },
    });

    const formattedUnits = units.map((u) => {
      const topics = u.Topic.map((t) => {
        const p = t.progress[0];
        return {
          id: t.id,
          name: t.name,
          masteryLevel: p?.masteryLevel ?? 0,
          questionsAsked: p?.questionsAsked ?? 0,
          correctAnswers: p?.correctAnswers ?? 0,
          lastStudiedAt: p?.lastStudiedAt ?? null,
        };
      });
      const totalTopics = topics.length;
      const masteredTopics = topics.filter((t) => t.masteryLevel >= 0.8).length;
      const avgMastery =
        totalTopics > 0
          ? topics.reduce((s, t) => s + t.masteryLevel, 0) / totalTopics
          : 0;
      return {
        id: u.id,
        name: u.name,
        topics,
        totalTopics,
        masteredTopics,
        avgMastery,
      };
    });

    return {
      subject,
      studyMinutes: studyMin._sum.durationMin ?? 0,
      units: formattedUnits,
      recentQuizzes: recentQuizzes.map((a) => ({
        id: a.id,
        score: a.score,
        total: a.total,
        accuracy: a.total > 0 ? a.score / a.total : 0,
        topicName: a.topic?.name ?? null,
        unitName: a.Unit?.name ?? null,
        createdAt: a.createdAt,
        completedAt: a.completedAt,
      })),
    };
  }

  /**
   * Mixed activity timeline — quizzes, mastery achievements, concerning chats.
   * Sorted newest first across all types.
   */
  async getChildTimeline(parentId: string, childId: string, daysParam?: number) {
    await this.assertLinked(parentId, childId);
    const days = clampDays(daysParam, 14, 90);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [quizzes, mastered, concerning, sessions] = await Promise.all([
      this.db.quizAttempt.findMany({
        where: { userId: childId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          subject: { select: { name: true, iconEmoji: true } },
          topic: { select: { name: true } },
        },
      }),
      this.db.topicProgress.findMany({
        where: {
          userId: childId,
          masteryLevel: { gte: 0.8 },
          updatedAt: { gte: since },
        },
        orderBy: { updatedAt: 'desc' },
        take: 30,
        include: {
          topic: {
            select: {
              name: true,
              subject: { select: { name: true, iconEmoji: true } },
            },
          },
        },
      }),
      this.db.chatMessage.findMany({
        where: {
          role: 'user',
          createdAt: { gte: since },
          session: { userId: childId },
          OR: [
            { wasRedirected: true },
            { safeCategory: { in: CONCERNING_CATEGORIES } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
        select: {
          id: true,
          sessionId: true,
          content: true,
          createdAt: true,
          safeCategory: true,
          wasRedirected: true,
        },
      }),
      this.db.chatSession.findMany({
        where: { userId: childId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 30,
        include: {
          subject: { select: { name: true, iconEmoji: true } },
          _count: { select: { messages: true } },
        },
      }),
    ]);

    type Event = {
      type: 'quiz' | 'mastery' | 'alert' | 'session';
      at: Date;
      payload: Record<string, unknown>;
    };
    const events: Event[] = [
      ...quizzes.map<Event>((q) => ({
        type: 'quiz',
        at: q.completedAt ?? q.createdAt,
        payload: {
          id: q.id,
          score: q.score,
          total: q.total,
          accuracy: q.total > 0 ? q.score / q.total : 0,
          subject: q.subject ? { name: q.subject.name, iconEmoji: q.subject.iconEmoji } : null,
          topicName: q.topic?.name ?? null,
          quizType: q.quizType,
        },
      })),
      ...mastered.map<Event>((m) => ({
        type: 'mastery',
        at: m.updatedAt,
        payload: {
          topicName: m.topic.name,
          subject: { name: m.topic.subject.name, iconEmoji: m.topic.subject.iconEmoji },
          masteryLevel: m.masteryLevel,
        },
      })),
      ...concerning.map<Event>((c) => ({
        type: 'alert',
        at: c.createdAt,
        payload: {
          messageId: c.id,
          sessionId: c.sessionId,
          content: c.content,
          category: c.safeCategory,
          wasRedirected: c.wasRedirected,
        },
      })),
      ...sessions.map<Event>((s) => ({
        type: 'session',
        at: s.createdAt,
        payload: {
          id: s.id,
          title: s.title,
          mode: s.mode,
          subject: s.subject ? { name: s.subject.name, iconEmoji: s.subject.iconEmoji } : null,
          messageCount: s._count.messages,
        },
      })),
    ];

    events.sort((a, b) => b.at.getTime() - a.at.getTime());
    return events.slice(0, 60);
  }

  /** Update child's daily study goal — parent-controlled adjustment. */
  async updateChildStudyGoal(parentId: string, childId: string, goalMin: number) {
    await this.assertLinked(parentId, childId);
    const clamped = Math.max(5, Math.min(480, Math.round(goalMin)));
    const profile = await this.db.studentProfile.upsert({
      where: { userId: childId },
      update: { studyGoal: clamped },
      create: { userId: childId, studyGoal: clamped, streakDays: 0 },
      select: { studyGoal: true },
    });
    return { goalMin: profile.studyGoal };
  }

  /**
   * Create a brand-new STUDENT account and link it to this parent atomically.
   * Children primarily use a username (many kids don't have email yet); email
   * is optional and can be added later. Parent shares username+password
   * with the child to log in.
   */
  async createChildAccount(
    parentId: string,
    input: {
      username: string;
      name: string;
      password: string;
      email?: string;
      curriculum?: Curriculum;
    },
  ) {
    const normalizedUsername = input.username.trim().toLowerCase();
    const normalizedEmail = input.email?.trim().toLowerCase() || null;

    const usernameTaken = await this.db.user.findUnique({ where: { username: normalizedUsername } });
    if (usernameTaken) throw new ConflictException('Tên đăng nhập đã được sử dụng');

    if (normalizedEmail) {
      const emailTaken = await this.db.user.findUnique({ where: { email: normalizedEmail } });
      if (emailTaken) throw new ConflictException('Email đã được sử dụng');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const child = await this.db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          username: normalizedUsername,
          email: normalizedEmail,
          name: input.name.trim(),
          passwordHash,
          role: 'STUDENT',
        },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
      await tx.studentProfile.create({
        data: {
          userId: created.id,
          curriculum: input.curriculum ?? 'IGCSE',
        },
      });
      await tx.parentChild.create({
        data: { parentId, childId: created.id },
      });
      return created;
    });

    return child;
  }

  /**
   * Issue a 6-digit invite code for an existing STUDENT account. Parent reads
   * the code aloud to the child; child redeems it from their dashboard.
   * `childIdentifier` may be an email or a username — service resolves either.
   * Code is hashed at rest; the cleartext value is returned exactly once here.
   */
  async createLinkRequest(parentId: string, childIdentifier: string) {
    const normalized = childIdentifier.trim().toLowerCase();
    const isEmail = normalized.includes('@');

    const parent = await this.db.user.findUnique({
      where: { id: parentId },
      select: { email: true, username: true, name: true },
    });
    if (parent) {
      if (parent.email && parent.email.toLowerCase() === normalized) {
        throw new BadRequestException('Không thể tự liên kết với chính mình');
      }
      if (parent.username && parent.username.toLowerCase() === normalized) {
        throw new BadRequestException('Không thể tự liên kết với chính mình');
      }
    }

    // Resolve identifier → existing user (if any). Email lookup if it has '@',
    // otherwise treat as username. Either way the literal identifier is what
    // we store on the request so child can redeem with the same value.
    const existingChild = isEmail
      ? await this.db.user.findUnique({
          where: { email: normalized },
          select: { id: true, role: true },
        })
      : await this.db.user.findUnique({
          where: { username: normalized },
          select: { id: true, role: true },
        });

    if (existingChild) {
      const alreadyLinked = await this.db.parentChild.findUnique({
        where: { parentId_childId: { parentId, childId: existingChild.id } },
      });
      if (alreadyLinked) throw new ConflictException('Đã liên kết với học sinh này');
    }

    // Cap pending requests so a parent can't flood the table.
    const pendingCount = await this.db.parentLinkRequest.count({
      where: {
        parentId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
    });
    if (pendingCount >= LINK_REQUEST_MAX_PER_PARENT) {
      throw new BadRequestException('Quá nhiều yêu cầu đang chờ. Hãy huỷ bớt trước khi tạo mới.');
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + LINK_REQUEST_TTL_HOURS * 60 * 60 * 1000);

    const request = await this.db.parentLinkRequest.create({
      data: {
        parentId,
        childIdentifier: normalized,
        codeHash,
        expiresAt,
      },
      select: { id: true, childIdentifier: true, expiresAt: true, status: true, createdAt: true },
    });

    // If child user exists, surface a notification so they see the invite right away.
    if (existingChild) {
      await this.notifications
        .create({
          userId: existingChild.id,
          type: 'info',
          title: `${parent?.name ?? 'Phụ huynh'} muốn liên kết tài khoản với bạn`,
          body: 'Mở trang Liên kết phụ huynh để nhập mã 6 chữ số.',
          link: '/parent-link',
        })
        .catch(() => {});
    }

    return { ...request, code };
  }

  async listLinkRequests(parentId: string) {
    const now = new Date();
    return this.db.parentLinkRequest.findMany({
      where: { parentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        childIdentifier: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        approvedAt: true,
      },
    }).then((rows) =>
      rows.map((r) => ({
        ...r,
        expired: r.status === 'PENDING' && r.expiresAt.getTime() < now.getTime(),
      })),
    );
  }

  async cancelLinkRequest(parentId: string, requestId: string) {
    const req = await this.db.parentLinkRequest.findUnique({ where: { id: requestId } });
    if (!req || req.parentId !== parentId) throw new NotFoundException('Yêu cầu không tồn tại');
    if (req.status !== 'PENDING') throw new BadRequestException('Yêu cầu không ở trạng thái chờ');
    await this.db.parentLinkRequest.update({
      where: { id: requestId },
      data: { status: 'REJECTED' },
    });
    return { success: true };
  }

  /**
   * Child redeems a 6-digit code to link with a parent. Verifies the code
   * against pending requests targeting either this user's email OR username,
   * creates the ParentChild link, and notifies the parent on success.
   */
  async redeemLinkRequest(childUserId: string, code: string) {
    const child = await this.db.user.findUnique({
      where: { id: childUserId },
      select: { id: true, email: true, username: true, name: true },
    });
    if (!child) throw new NotFoundException('Tài khoản không tồn tại');

    const identifiers: string[] = [];
    if (child.email) identifiers.push(child.email.toLowerCase());
    if (child.username) identifiers.push(child.username.toLowerCase());
    if (identifiers.length === 0) {
      throw new BadRequestException('Tài khoản chưa có email/username để xác thực');
    }

    const now = new Date();
    const candidates = await this.db.parentLinkRequest.findMany({
      where: {
        childIdentifier: { in: identifiers },
        status: 'PENDING',
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (candidates.length === 0) {
      throw new BadRequestException('Không có yêu cầu liên kết nào đang chờ cho tài khoản này');
    }

    let matched: typeof candidates[number] | null = null;
    for (const c of candidates) {
      if (await bcrypt.compare(code, c.codeHash)) {
        matched = c;
        break;
      }
    }
    if (!matched) throw new BadRequestException('Mã liên kết không đúng hoặc đã hết hạn');

    // Already-linked safety net (race condition between two redemptions).
    const alreadyLinked = await this.db.parentChild.findUnique({
      where: { parentId_childId: { parentId: matched.parentId, childId: child.id } },
    });
    if (alreadyLinked) {
      await this.db.parentLinkRequest.update({
        where: { id: matched.id },
        data: { status: 'APPROVED', approvedAt: now },
      });
      return { success: true, alreadyLinked: true };
    }

    await this.db.$transaction([
      this.db.parentChild.create({
        data: { parentId: matched.parentId, childId: child.id },
      }),
      this.db.parentLinkRequest.update({
        where: { id: matched.id },
        data: { status: 'APPROVED', approvedAt: now },
      }),
    ]);

    // Notify parent that link succeeded.
    await this.notifications
      .create({
        userId: matched.parentId,
        type: 'success',
        title: `${child.name} đã chấp nhận liên kết`,
        body: 'Bạn đã có thể xem báo cáo học tập của con.',
        link: '/parent',
      })
      .catch(() => {});

    return { success: true, alreadyLinked: false };
  }
}
