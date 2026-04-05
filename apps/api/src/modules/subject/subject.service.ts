import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

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
        milestones: {
          orderBy: { orderIndex: 'asc' },
          include: {
            topics: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
      },
    });

    if (!subject) throw new NotFoundException('Subject not found');

    return subject.milestones;
  }
}
