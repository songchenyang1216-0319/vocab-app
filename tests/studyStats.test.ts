import { beforeEach, describe, expect, it, vi } from "vitest";
import { getStudyStats } from "../src/utils/studyStats";
import { STUDY_STORAGE_KEY, type AppProgress, type WordStudyRecord } from "../src/utils/studyStorage";
import { TODAY_TASK_STORAGE_KEY } from "../src/utils/todayTaskStorage";
import { VOCAB_BOOK_STORAGE_KEY } from "../src/utils/vocabBookStorage";

function createLocalStorageMock() {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
  };
}

function createRecord(
  wordId: number,
  status: WordStudyRecord["status"],
  wrongCount = 0,
): WordStudyRecord {
  return {
    wordId,
    status,
    reviewCount: 1,
    wrongCount,
    correctStreak: status === "known" ? 1 : 0,
    lastReviewAt: "2026-05-12T08:00:00.000Z",
    nextReviewAt: "2026-05-11T08:00:00.000Z",
  };
}

function saveProgress(records: AppProgress["records"]) {
  const progress: AppProgress = {
    version: 1,
    dailyGoal: 20,
    currentWordIndex: 0,
    today: "2026-05-12",
    todayStudiedIds: [],
    records,
  };

  window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(progress));
}

describe("getStudyStats", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: createLocalStorageMock(),
      },
      configurable: true,
    });
  });

  it("没有学习记录时返回默认统计", () => {
    const stats = getStudyStats();

    expect(stats.learnedCount).toBe(0);
    expect(stats.knownCount).toBe(0);
    expect(stats.vagueCount).toBe(0);
    expect(stats.unknownCount).toBe(0);
    expect(stats.wrongCount).toBe(0);
    expect(stats.masteryRate).toBe(0);
  });

  it("有 known / vague / unknown 记录时统计正确", () => {
    window.localStorage.setItem(
      TODAY_TASK_STORAGE_KEY,
      JSON.stringify({
        date: "2026-05-12",
        newWordIds: [1, 2],
        reviewWordIds: [3],
        completedNewCount: 1,
        completedReviewCount: 1,
      }),
    );
    window.localStorage.setItem(VOCAB_BOOK_STORAGE_KEY, JSON.stringify([{ wordId: 3, addedAt: "2026-05-12" }]));
    saveProgress({
      1: createRecord(1, "known"),
      2: createRecord(2, "vague"),
      3: createRecord(3, "unknown"),
    });

    const stats = getStudyStats();

    expect(stats.learnedCount).toBe(3);
    expect(stats.knownCount).toBe(1);
    expect(stats.vagueCount).toBe(1);
    expect(stats.unknownCount).toBe(1);
    expect(stats.vocabBookCount).toBe(1);
    expect(stats.todayTotalCompleted).toBe(2);
    expect(stats.todayTotal).toBe(3);
    expect(stats.masteryRate).toBeCloseTo(1 / 3);
  });

  it("wrongCount 按 wrongCount > 0 统计", () => {
    saveProgress({
      1: createRecord(1, "known", 0),
      2: createRecord(2, "vague", 1),
      3: createRecord(3, "unknown", 0),
    });

    expect(getStudyStats().wrongCount).toBe(1);
  });
});
