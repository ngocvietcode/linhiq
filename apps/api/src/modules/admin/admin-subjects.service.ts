import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Curriculum } from '@linhiq/database';

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
        documents: {
          include: {
            bookVolume: {
              select: { id: true, title: true, shortTitle: true, bookType: true, isDefault: true, totalPages: true },
            },
            _count: { select: { chunks: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        bookVolumes: {
          select: { id: true, title: true, shortTitle: true, bookType: true, isDefault: true, totalPages: true, documentId: true },
          orderBy: { orderIndex: 'asc' },
        },
        Unit: {
          orderBy: { orderIndex: 'asc' },
          include: {
            Topic: {
              orderBy: { orderIndex: 'asc' },
              include: {
                chunks: {
                  select: {
                    id: true,
                    content: true,
                    document: { select: { id: true, title: true, bookVolume: { select: { shortTitle: true } } } },
                  },
                  orderBy: { chunkIndex: 'asc' }
                }
              }
            }
          }
        }
      }
    });
    if (!subject) throw new NotFoundException('Subject not found');

    // Flatten Prisma's capitalized relation names (Unit / Topic) into the
    // shape the admin UI expects: `milestones[].topics[].chunks[]`.
    const { Unit, ...rest } = subject;
    const milestones = Unit.map((u) => {
      const { Topic, ...unitRest } = u;
      return { ...unitRest, topics: Topic };
    });
    return { ...rest, milestones };
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
