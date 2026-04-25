"use client";

const PROGRESS_KEY = (bookId: string) => `reader:progress:${bookId}`;
const BOOKMARKS_KEY = (bookId: string) => `reader:bookmarks:${bookId}`;
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

export function getBookmarks(bookId: string): number[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(BOOKMARKS_KEY(bookId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(bookId: string, page: number): number[] {
  const list = getBookmarks(bookId);
  const exists = list.includes(page);
  const next = exists ? list.filter((p) => p !== page) : [...list, page].sort((a, b) => a - b);
  if (isBrowser()) {
    window.localStorage.setItem(BOOKMARKS_KEY(bookId), JSON.stringify(next));
  }
  return next;
}

export function isBookmarked(bookId: string, page: number): boolean {
  return getBookmarks(bookId).includes(page);
}
