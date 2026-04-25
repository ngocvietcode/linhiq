"use client";

import { api } from "./api";

// ── Read-progress / last-page (local only, per-device) ─────────────

const PROGRESS_KEY = (bookId: string) => `reader:progress:${bookId}`;
const LAST_PAGE_KEY = (bookId: string) => `reader:lastPage:${bookId}`;

const isBrowser = () => typeof window !== "undefined";

export function getMaxPageReached(bookId: string): number {
  if (!isBrowser()) return 0;
  const raw = window.localStorage.getItem(PROGRESS_KEY(bookId));
  return raw ? Number(raw) || 0 : 0;
}

export function setMaxPageReached(bookId: string, page: number): number {
  if (!isBrowser()) return page;
  const current = getMaxPageReached(bookId);
  const next = Math.max(current, page);
  window.localStorage.setItem(PROGRESS_KEY(bookId), String(next));
  return next;
}

export function getLastPage(bookId: string): number | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(LAST_PAGE_KEY(bookId));
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function setLastPage(bookId: string, page: number): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(LAST_PAGE_KEY(bookId), String(page));
}

// ── Bookmarks (server) ─────────────────────────────────────────────

export interface Bookmark {
  id: string;
  bookVolumeId: string;
  pageNumber: number;
  label: string | null;
  createdAt: string;
}

export async function fetchBookmarks(bookVolumeId: string): Promise<Bookmark[]> {
  return api<Bookmark[]>(
    `/reader/bookmarks?bookVolumeId=${encodeURIComponent(bookVolumeId)}`,
  );
}

export async function createBookmark(
  bookVolumeId: string,
  pageNumber: number,
  label?: string,
): Promise<Bookmark> {
  return api<Bookmark>("/reader/bookmarks", {
    method: "POST",
    body: { bookVolumeId, pageNumber, label },
  });
}

export async function deleteBookmarkByPage(
  bookVolumeId: string,
  pageNumber: number,
): Promise<void> {
  await api(
    `/reader/bookmarks?bookVolumeId=${encodeURIComponent(bookVolumeId)}&pageNumber=${pageNumber}`,
    { method: "DELETE" },
  );
}

// ── Notes (server) ─────────────────────────────────────────────────

export interface Note {
  id: string;
  bookVolumeId: string;
  pageNumber: number;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchNotes(bookVolumeId: string): Promise<Note[]> {
  return api<Note[]>(
    `/reader/notes?bookVolumeId=${encodeURIComponent(bookVolumeId)}`,
  );
}

export async function upsertNote(
  bookVolumeId: string,
  pageNumber: number,
  content: string,
): Promise<Note> {
  return api<Note>("/reader/notes", {
    method: "POST",
    body: { bookVolumeId, pageNumber, content },
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  await api(`/reader/notes/${noteId}`, { method: "DELETE" });
}
