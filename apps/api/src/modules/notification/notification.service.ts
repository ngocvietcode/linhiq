import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}

@Injectable()
export class NotificationService {
  constructor(private readonly db: DatabaseService) {}

  async list(userId: string, limit = 20) {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(50, Math.max(1, limit)),
    });
  }

  async unreadCount(userId: string) {
    const count = await this.db.notification.count({
      where: { userId, readAt: null },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    return this.db.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.db.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async create(input: CreateNotificationInput) {
    return this.db.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
      },
    });
  }

  /**
   * Fan out a notification to every parent linked to the given child.
   * Used by mastery/streak/safety-redirect events so parents are kept in the loop.
   */
  async notifyParents(
    childId: string,
    input: Omit<CreateNotificationInput, 'userId'>,
  ) {
    const links = await this.db.parentChild.findMany({
      where: { childId },
      select: { parentId: true },
    });
    if (links.length === 0) return;
    await this.db.notification.createMany({
      data: links.map((l) => ({
        userId: l.parentId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      })),
    });
  }
}
