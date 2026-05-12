import type { WordNote } from "../types/wordNote";

export const WORD_NOTES_STORAGE_KEY = "word-notes";

function isWordNote(value: unknown): value is WordNote {
  if (!value || typeof value !== "object") {
    return false;
  }

  const note = value as Partial<WordNote>;

  return (
    typeof note.wordId === "number" &&
    typeof note.content === "string" &&
    typeof note.createdAt === "string" &&
    typeof note.updatedAt === "string"
  );
}

function parseWordNotes(rawValue: string | null): WordNote[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isWordNote);
  } catch {
    console.warn("个人笔记读取失败：localStorage 中的数据不是有效 JSON，已返回空数组。");
    return [];
  }
}

function saveWordNotes(notes: WordNote[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WORD_NOTES_STORAGE_KEY, JSON.stringify(notes));
}

export function getAllWordNotes(): WordNote[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseWordNotes(window.localStorage.getItem(WORD_NOTES_STORAGE_KEY));
}

export function getWordNote(wordId: number): WordNote | null {
  return getAllWordNotes().find((note) => note.wordId === wordId) ?? null;
}

export function saveWordNote(wordId: number, content: string): WordNote | null {
  const trimmedContent = content.trim();

  // 空内容等同于删除，避免留下不可见的空笔记。
  if (!trimmedContent) {
    deleteWordNote(wordId);
    return null;
  }

  const now = new Date().toISOString();
  const notes = getAllWordNotes();
  const oldNote = notes.find((note) => note.wordId === wordId);
  const nextNote: WordNote = {
    wordId,
    content: trimmedContent,
    createdAt: oldNote?.createdAt ?? now,
    updatedAt: now,
  };
  const nextNotes = oldNote
    ? notes.map((note) => (note.wordId === wordId ? nextNote : note))
    : [...notes, nextNote];

  saveWordNotes(nextNotes);

  return nextNote;
}

export function deleteWordNote(wordId: number): WordNote[] {
  const nextNotes = getAllWordNotes().filter((note) => note.wordId !== wordId);

  saveWordNotes(nextNotes);

  return nextNotes;
}

export function hasWordNote(wordId: number): boolean {
  return Boolean(getWordNote(wordId));
}

export function clearAllWordNotes(): WordNote[] {
  const nextNotes: WordNote[] = [];

  saveWordNotes(nextNotes);

  return nextNotes;
}
