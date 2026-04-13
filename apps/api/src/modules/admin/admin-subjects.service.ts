import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Curriculum } from '@javirs/database';

@Injectable()
export class AdminSubjectsService {
  constructor(private readonly db: DatabaseService) {}

  async getAllSubjects() {
    return this.db.subject.findMany({
      include: {
        _count: { select: { documents: true, topics: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getSubject(id: string) {
    const subject = await this.db.subject.findUnique({
      where: { id },
      include: {
        documents: true,
        milestones: {
          orderBy: { orderIndex: 'asc' },
          include: {
            topics: {
              orderBy: { orderIndex: 'asc' },
              include: {
                chunks: {
                  select: { id: true, content: true },
                  orderBy: { chunkIndex: 'asc' }
                }
              }
            }
          }
        }
      }
    });
    if (!subject) throw new NotFoundException('Subject not found');
    return subject;
  }

  async createSubject(data: { name: string; curriculum: Curriculum; description?: string; iconEmoji?: string }) {
    return this.db.subject.create({ data });
  }

  async updateSubject(id: string, data: { name?: string; curriculum?: Curriculum; description?: string; iconEmoji?: string }) {
    return this.db.subject.update({ where: { id }, data });
  }

  async deleteSubject(id: string) {
    return this.db.subject.delete({ where: { id } });
  }

  async getSubjectDocuments(id: string) {
    return this.db.document.findMany({
      where: { subjectId: id, sourceType: 'TEXTBOOK' }
    });
  }
}
