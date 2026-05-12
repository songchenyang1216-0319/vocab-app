import type { VocabBookItem } from "../types/vocabBook";

export const VOCAB_BOOK_STORAGE_KEY = "vocab-book-items";

function isVocabBookItem(value: unknown): value is VocabBookItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Partial<VocabBookItem>;

  return typeof item.wordId === "number" && typeof item.addedAt === "string";
}

function parseVocabBookItems(rawValue: string | null): VocabBookItem[] {
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isVocabBookItem);
  } catch {
    console.warn("生词本读取失败：localStorage 中的数据不是有效 JSON，已返回空数组。");
    return [];
  }
}

function saveVocabBookItems(items: VocabBookItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(VOCAB_BOOK_STORAGE_KEY, JSON.stringify(items));
}

export function getVocabBookItems(): VocabBookItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseVocabBookItems(window.localStorage.getItem(VOCAB_BOOK_STORAGE_KEY));
}

export function addToVocabBook(wordId: number): VocabBookItem[] {
  const items = getVocabBookItems();

  if (items.some((item) => item.wordId === wordId)) {
    return items;
  }

  const nextItems = [...items, { wordId, addedAt: new Date().toISOString() }];
  saveVocabBookItems(nextItems);

  return nextItems;
}

export function removeFromVocabBook(wordId: number): VocabBookItem[] {
  const nextItems = getVocabBookItems().filter((item) => item.wordId !== wordId);

  saveVocabBookItems(nextItems);

  return nextItems;
}

export function isInVocabBook(wordId: number): boolean {
  return getVocabBookItems().some((item) => item.wordId === wordId);
}

export function clearVocabBook(): VocabBookItem[] {
  const nextItems: VocabBookItem[] = [];

  saveVocabBookItems(nextItems);

  return nextItems;
}
