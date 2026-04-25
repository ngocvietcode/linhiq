import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import type {
  AdminListSessionsQuery,
  AdminBulkUserIds,
} from '@linhiq/validators';

@Injectable()
export class AdminSessionsService {
  private readonly logger = new Logger(AdminSessionsService.name);

  constructor(private readonly db: DatabaseService) {}

  async list(query: AdminListSessionsQuery) {
    const { q, mode, subjectId, userId, hasMessages, page, pageSize, sortBy, sortDir } = query;

    const where: any = {};
    if (mode) where.mode = mode;
    if (subjectId) where.subjectId = subjectId;
    if (userId) where.userId = userId;
    if (hasMessages) where.messages = { some: {} };
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { name: { contains: q, mode: 'insensitive' } } },
        { subject: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.chatSession.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          subject: { select: { id: true, name: true, iconEmoji: true } },
          _count: { select: { messages: true } },
          topicStats: {
            select: {
              academic: true, general: true, hobbies: true, life: true,
              redirected: true, totalMsg: true,
            },
          },
        },
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.chatSession.count({ where }),
    ]);

    const stats = await this.db.chatSession.groupBy({
      by: ['mode'],
      _count: { _all: true },
    });
    const counts = stats.reduce<Record<string, number>>((acc, s) => {
      acc[s.mode] = s._count._all;
      return acc;
    }, {});

    return {
      data,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
      counts: {
        all: total,
        SUBJECT: counts.SUBJECT || 0,
        OPEN: counts.OPEN || 0,
      },
    };
  }

  async getOne(id: string, messageLimit = 200) {
    const session = await this.db.chatSession.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        subject: { select: { id: true, name: true, iconEmoji: true } },
        topicStats: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: messageLimit,
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
            hintLevel: true,
            imageUrl: true,
            modelUsed: true,
            tokensUsed: true,
            ragSources: true,
            safeCategory: true,
            wasRedirected: true,
          },
        },
        _count: { select: { messages: true } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async remove(id: string, actorId: string) {
    const target = await this.db.chatSession.findUnique({
      where: { id },
      select: { id: true, userId: true, title: true },
    });
    if (!target) throw new NotFoundException('Session not found');

    await this.db.chatSession.delete({ where: { id } });
    await this.audit(actorId, 'session.delete', id, {
      userId: target.userId,
      title: target.title,
    });
    return { id };
  }

  async bulkRemove(ids: string[], actorId: string) {
    if (ids.length === 0) {
      throw new BadRequestException('No sessions selected');
    }
    const result = await this.db.chatSession.deleteMany({
      where: { id: { in: ids } },
    });
    await this.audit(actorId, 'session.bulk_delete', null, {
      requested: ids.length,
      deleted: result.count,
    });
    return { deleted: result.count };
  }

  async stats() {
    const [totalSessions, totalMessages, subjects, recent24h] = await Promise.all([
      this.db.chatSession.count(),
      this.db.chatMessage.count(),
      this.db.chatSession.groupBy({
        by: ['subjectId'],
        _count: { _all: true },
        orderBy: { _count: { subjectId: 'desc' } },
        take: 5,
      }),
      this.db.chatSession.count({
        where: { updatedAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) } },
      }),
    ]);

    const subjectIds = subjects.map((s) => s.subjectId).filter((x): x is string => !!x);
    const subjectRecords = subjectIds.length
      ? await this.db.subject.findMany({
          where: { id: { in: subjectIds } },
          select: { id: true, name: true, iconEmoji: true },
        })
      : [];
    const subjectMap = new Map(subjectRecords.map((s) => [s.id, s]));

    return {
      totalSessions,
      totalMessages,
      recent24h,
      topSubjects: subjects.map((s) => ({
        subject: s.subjectId ? subjectMap.get(s.subjectId) || null : null,
        count: s._count._all,
      })),
    };
  }

  private async audit(adminId: string, action: string, target: string | null, metadata: unknown) {
    try {
      await this.db.auditLog.create({
        data: {
          adminId,
          action,
          target: target ?? undefined,
          metadata: metadata as any,
        },
      });
    } catch (e: any) {
      this.logger.warn(`AuditLog failed: ${e.message}`);
    }
  }
}
