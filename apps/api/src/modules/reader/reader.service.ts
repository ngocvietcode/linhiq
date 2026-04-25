import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReaderService {
  constructor(private readonly db: DatabaseService) {}

  // ── Bookmarks ─────────────────────────────

  async listBookmarks(userId: string, bookVolumeId: string) {
    return this.db.readerBookmark.findMany({
      where: { userId, bookVolumeId },
      orderBy: { pageNumber: 'asc' },
    });
  }

  async createBookmark(
    userId: string,
    bookVolumeId: string,
    pageNumber: number,
    label?: string,
  ) {
    return this.db.readerBookmark.upsert({
      where: {
        userId_bookVolumeId_pageNumber: { userId, bookVolumeId, pageNumber },
      },
      update: { label: label ?? null },
      create: { userId, bookVolumeId, pageNumber, label: label ?? null },
    });
  }

  async deleteBookmark(userId: string, bookmarkId: string) {
    const bookmark = await this.db.readerBookmark.findUnique({
      where: { id: bookmarkId },
    });
    if (!bookmark || bookmark.userId !== userId) {
      throw new NotFoundException('Bookmark not found');
    }
    await this.db.readerBookmark.delete({ where: { id: bookmarkId } });
    return { success: true };
  }

  async deleteBookmarkByPage(
    userId: string,
    bookVolumeId: string,
    pageNumber: number,
  ) {
    await this.db.readerBookmark.deleteMany({
      where: { userId, bookVolumeId, pageNumber },
    });
    return { success: true };
  }

  // ── Notes ─────────────────────────────────

  async listNotes(userId: string, bookVolumeId: string) {
    return this.db.readerNote.findMany({
      where: { userId, bookVolumeId },
      orderBy: [{ pageNumber: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async upsertNote(
    userId: string,
    bookVolumeId: string,
    pageNumber: number,
    content: string,
  ) {
    // One note per (user, book, page) — if exists update, else create
    const existing = await this.db.readerNote.findFirst({
      where: { userId, bookVolumeId, pageNumber },
    });
    if (existing) {
      return this.db.readerNote.update({
        where: { id: existing.id },
        data: { content },
      });
    }
    return this.db.readerNote.create({
      data: { userId, bookVolumeId, pageNumber, content },
    });
  }

  async updateNote(userId: string, noteId: string, content: string) {
    const note = await this.db.readerNote.findUnique({ where: { id: noteId } });
    if (!note || note.userId !== userId) {
      throw new NotFoundException('Note not found');
    }
    return this.db.readerNote.update({
      where: { id: noteId },
      data: { content },
    });
  }

  async deleteNote(userId: string, noteId: string) {
    const note = await this.db.readerNote.findUnique({ where: { id: noteId } });
    if (!note || note.userId !== userId) {
      throw new NotFoundException('Note not found');
    }
    await this.db.readerNote.delete({ where: { id: noteId } });
    return { success: true };
  }
}
