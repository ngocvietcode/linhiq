import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import type {
  AdminCreateUserInput,
  AdminUpdateUserInput,
  AdminListUsersQuery,
} from '@linhiq/validators';

const LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  avatarUrl: true,
  createdAt: true,
  updatedAt: true,
  studentProfile: {
    select: { streakDays: true, lastStudyAt: true, curriculum: true },
  },
  _count: { select: { chatSessions: true, quizAttempts: true } },
} as const;

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);

  constructor(private readonly db: DatabaseService) {}

  async list(query: AdminListUsersQuery) {
    const { q, role, status, page, pageSize, sortBy, sortDir } = query;

    const where: any = {};
    if (role) where.role = role;
    if (status === 'active') where.isActive = true;
    if (status === 'banned') where.isActive = false;
    if (q) {
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: LIST_SELECT,
        orderBy: { [sortBy]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.user.count({ where }),
    ]);

    const stats = await this.db.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });
    const counts = stats.reduce<Record<string, number>>((acc, s) => {
      acc[s.role] = s._count._all;
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
        STUDENT: counts.STUDENT || 0,
        ADMIN: counts.ADMIN || 0,
        PARENT: counts.PARENT || 0,
      },
    };
  }

  async getOne(id: string) {
    const user = await this.db.user.findUnique({
      where: { id },
      select: {
        ...LIST_SELECT,
        googleId: true,
        studentProfile: {
          select: {
            curriculum: true,
            timezone: true,
            studyGoal: true,
            streakDays: true,
            lastStudyAt: true,
            enrollments: {
              select: {
                id: true,
                subject: { select: { id: true, name: true, iconEmoji: true } },
              },
            },
          },
        },
        chatSessions: {
          take: 10,
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            mode: true,
            createdAt: true,
            updatedAt: true,
            subject: { select: { name: true, iconEmoji: true } },
            _count: { select: { messages: true } },
          },
        },
        parentLinks: {
          select: {
            id: true,
            child: { select: { id: true, name: true, email: true } },
          },
        },
        childLinks: {
          select: {
            id: true,
            parent: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(input: AdminCreateUserInput, actorId: string) {
    const existing = await this.db.user.findUnique({
      where: { email: input.email },
    });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await this.db.user.create({
      data: {
        email: input.email,
        name: input.name,
        role: input.role,
        passwordHash,
      },
      select: LIST_SELECT,
    });

    await this.audit(actorId, 'user.create', user.id, {
      email: user.email,
      role: user.role,
    });

    return user;
  }

  async update(id: string, input: AdminUpdateUserInput, actorId: string) {
    const target = await this.db.user.findUnique({
      where: { id },
      select: { id: true, role: true, email: true },
    });
    if (!target) throw new NotFoundException('User not found');

    // Self-protection: an admin cannot demote themselves
    if (id === actorId && input.role && input.role !== 'ADMIN') {
      throw new ForbiddenException('You cannot demote your own admin account');
    }

    if (input.email && input.email !== target.email) {
      const taken = await this.db.user.findUnique({
        where: { email: input.email },
      });
      if (taken) throw new ConflictException('Email already in use');
    }

    const user = await this.db.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.email !== undefined && { email: input.email }),
        ...(input.role !== undefined && { role: input.role }),
      },
      select: LIST_SELECT,
    });

    await this.audit(actorId, 'user.update', id, input);
    return user;
  }

  async setActive(id: string, isActive: boolean, actorId: string) {
    if (id === actorId && !isActive) {
      throw new ForbiddenException('You cannot ban your own account');
    }
    const target = await this.db.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');

    const user = await this.db.user.update({
      where: { id },
      data: { isActive },
      select: LIST_SELECT,
    });

    await this.audit(actorId, isActive ? 'user.unban' : 'user.ban', id, null);
    return user;
  }

  async resetPassword(id: string, password: string | undefined, actorId: string) {
    const target = await this.db.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');

    const tempPassword = password || this.generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    await this.db.user.update({
      where: { id },
      data: { passwordHash },
    });

    await this.audit(actorId, 'user.reset_password', id, {
      generated: !password,
    });

    return { tempPassword };
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    const target = await this.db.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true },
    });
    if (!target) throw new NotFoundException('User not found');

    await this.db.user.delete({ where: { id } });
    await this.audit(actorId, 'user.delete', id, {
      email: target.email,
      role: target.role,
    });
    return { id };
  }

  async bulkRemove(ids: string[], actorId: string) {
    const filtered = ids.filter((i) => i !== actorId);
    if (filtered.length === 0) {
      throw new BadRequestException('No deletable users in selection');
    }
    const result = await this.db.user.deleteMany({
      where: { id: { in: filtered } },
    });
    await this.audit(actorId, 'user.bulk_delete', null, {
      requested: ids.length,
      deleted: result.count,
      skippedSelf: ids.length - filtered.length,
    });
    return { deleted: result.count, skipped: ids.length - filtered.length };
  }

  private generateTempPassword(): string {
    // 12-char base64url, no padding
    return randomBytes(9).toString('base64url');
  }

  private async audit(
    adminId: string,
    action: string,
    target: string | null,
    metadata: unknown,
  ) {
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
