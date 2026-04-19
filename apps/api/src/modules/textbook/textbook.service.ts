import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TextbookService {
  private readonly logger = new Logger(TextbookService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Get all book volumes for a subject
   */
  async getBooksForSubject(subjectId: string) {
    const books = await this.db.bookVolume.findMany({
      where: { subjectId },
      select: {
        id: true,
        title: true,
        shortTitle: true,
        bookType: true,
        isDefault: true,
        totalPages: true,
        coverColor: true,
        subjectId: true,
      },
      orderBy: [{ isDefault: 'desc' }, { bookType: 'asc' }],
    });

    if (!books.length) {
      return [];
    }

    return books;
  }

  /**
   * Get table of contents for a book volume
   */
  async getTableOfContents(bookVolumeId: string) {
    const book = await this.db.bookVolume.findUnique({
      where: { id: bookVolumeId },
    });

    if (!book) {
      throw new NotFoundException(`Book volume ${bookVolumeId} not found`);
    }

    const pageTopics = await this.db.bookPageTopic.findMany({
      where: { bookVolumeId },
      include: {
        topic: { select: { id: true, name: true } },
      },
      orderBy: { pageNumber: 'asc' },
    });

    // Group by chapter, deduplicate (only first page of each chapter/topic transition)
    const tocMap = new Map<string, { chapterName: string; topicName: string | null; topicId: string | null; startPage: number }>();

    for (const pt of pageTopics) {
      const key = `${pt.chapterName ?? ''}::${pt.topicId ?? ''}`;
      if (!tocMap.has(key)) {
        tocMap.set(key, {
          chapterName: pt.chapterName ?? 'Untitled Chapter',
          topicName: pt.topic?.name ?? null,
          topicId: pt.topicId ?? null,
          startPage: pt.pageNumber,
        });
      }
    }

    return Array.from(tocMap.values());
  }

  /**
   * Get page context metadata (topic/chapter for a given page)
   */
  async getPageContext(bookVolumeId: string, pageNumber: number) {
    const book = await this.db.bookVolume.findUnique({
      where: { id: bookVolumeId },
    });

    if (!book) {
      throw new NotFoundException(`Book volume ${bookVolumeId} not found`);
    }

    // Find exact match or closest previous page
    const pageTopic = await this.db.bookPageTopic.findFirst({
      where: {
        bookVolumeId,
        pageNumber: { lte: pageNumber },
      },
      include: {
        topic: { select: { id: true, name: true } },
      },
      orderBy: { pageNumber: 'desc' },
    });

    return {
      pageNumber,
      topicId: pageTopic?.topicId ?? null,
      topicName: pageTopic?.topic?.name ?? null,
      chapterName: pageTopic?.chapterName ?? null,
      bookVolumeId,
    };
  }

  /**
   * Return the file path for a book page image
   * Throws NotFoundException if book or page file is not found
   */
  async getPageImagePath(bookVolumeId: string, pageNumber: number): Promise<string> {
    const book = await this.db.bookVolume.findUnique({
      where: { id: bookVolumeId },
    });

    if (!book || !book.pagesDir) {
      throw new NotFoundException(`Book volume ${bookVolumeId} not found or has no pages`);
    }

    if (book.totalPages && (pageNumber < 1 || pageNumber > book.totalPages)) {
      throw new NotFoundException(`Page ${pageNumber} out of range`);
    }

    const paddedPage = String(pageNumber).padStart(3, '0');
    const imagePath = path.resolve(book.pagesDir, `page_${paddedPage}.webp`);

    if (!fs.existsSync(imagePath)) {
      throw new NotFoundException(`Page image not found: page_${paddedPage}.webp`);
    }

    return imagePath;
  }
}
