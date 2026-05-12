import type { VocabWord } from "../types/vocab";
import type { AppSettings } from "./settingsStorage";
import { buildStudyQueueIds, getStudyQueueMode, SKIP_SIMPLE_WORDS } from "./studyWords";

export const STUDY_STORAGE_KEY = "metro-vocab-progress-v1";

export type StudyStatus = "known" | "vague" | "unknown";

export interface WordStudyRecord {
  wordId: number;
  status: StudyStatus;
  reviewCount: number;
  wrongCount: number;
  correctStreak: number;
  lastReviewAt: string;
  nextReviewAt: string;
}

export interface AppProgress {
  version: number;
  dailyGoal: number;
  currentWordIndex: number;
  today: string;
  todayStudiedIds: number[];
  records: Record<number, WordStudyRecord>;
  studyQueueIds?: number[];
  studyQueueMode?: string;
  studyQueueCreatedAt?: string;
  studyQueueUpdatedAt?: string;
}

function getTodayText(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createDefaultProgress(): AppProgress {
  return {
    version: 1,
    dailyGoal: 20,
    currentWordIndex: 0,
    today: getTodayText(),
    todayStudiedIds: [],
    records: {},
  };
}

function normalizeProgressDate(progress: AppProgress): AppProgress {
  const today = getTodayText();

  if (progress.today === today) {
    return progress;
  }

  // 到了新的一天，只清空“今日已背”，历史学习记录继续保留。
  return {
    ...progress,
    today,
    todayStudiedIds: [],
  };
}

function getKnownReviewDays(correctStreak: number) {
  if (correctStreak <= 1) {
    return 3;
  }

  if (correctStreak === 2) {
    return 7;
  }

  if (correctStreak === 3) {
    return 15;
  }

  return 30;
}

export function getStatusPriority(status: StudyStatus) {
  if (status === "unknown") {
    return 2;
  }

  if (status === "vague") {
    return 1;
  }

  return 0;
}

export function isDueReviewRecord(record: WordStudyRecord, nowTime: number) {
  const nextReviewTime = new Date(record.nextReviewAt).getTime();

  return Number.isFinite(nextReviewTime) && nextReviewTime <= nowTime;
}

export function sortReviewRecords(left: WordStudyRecord, right: WordStudyRecord) {
  const statusDiff = getStatusPriority(right.status) - getStatusPriority(left.status);

  if (statusDiff !== 0) {
    return statusDiff;
  }

  const wrongCountDiff = right.wrongCount - left.wrongCount;

  if (wrongCountDiff !== 0) {
    return wrongCountDiff;
  }

  return new Date(left.nextReviewAt).getTime() - new Date(right.nextReviewAt).getTime();
}

export function calculateNextReviewAt(status: StudyStatus, correctStreak: number, now = new Date()) {
  const next = new Date(now);

  if (status === "known") {
    next.setDate(next.getDate() + getKnownReviewDays(correctStreak));
  }

  if (status === "vague") {
    next.setDate(next.getDate() + 1);
  }

  if (status === "unknown") {
    next.setMinutes(next.getMinutes() + 30);
  }

  return next.toISOString();
}

function buildUpdatedRecord(oldRecord: WordStudyRecord | undefined, wordId: number, status: StudyStatus, now: Date) {
  const nextCorrectStreak = status === "known" ? (oldRecord?.correctStreak ?? 0) + 1 : 0;
  const shouldAddWrongCount = status === "vague" || status === "unknown";

  return {
    wordId,
    status,
    reviewCount: (oldRecord?.reviewCount ?? 0) + 1,
    wrongCount: (oldRecord?.wrongCount ?? 0) + (shouldAddWrongCount ? 1 : 0),
    correctStreak: nextCorrectStreak,
    lastReviewAt: now.toISOString(),
    nextReviewAt: calculateNextReviewAt(status, nextCorrectStreak, now),
  };
}

function getKnownReviewAtAfterSevenDays(now: Date) {
  const next = new Date(now);
  next.setDate(next.getDate() + 7);

  return next.toISOString();
}

function parseProgress(rawValue: string | null): AppProgress {
  if (!rawValue) {
    return createDefaultProgress();
  }

  try {
    const parsed = JSON.parse(rawValue) as AppProgress;

    return normalizeProgressDate({
      ...createDefaultProgress(),
      ...parsed,
      records: Object.fromEntries(
        Object.entries(parsed.records ?? {}).map(([key, record]) => [
          key,
          {
            ...record,
            correctStreak: typeof record?.correctStreak === "number" ? record.correctStreak : 0,
          },
        ]),
      ),
      todayStudiedIds: parsed.todayStudiedIds ?? [],
      studyQueueIds: Array.isArray(parsed.studyQueueIds) ? parsed.studyQueueIds : undefined,
      studyQueueMode: typeof parsed.studyQueueMode === "string" ? parsed.studyQueueMode : undefined,
      studyQueueCreatedAt:
        typeof parsed.studyQueueCreatedAt === "string" ? parsed.studyQueueCreatedAt : undefined,
      studyQueueUpdatedAt:
        typeof parsed.studyQueueUpdatedAt === "string" ? parsed.studyQueueUpdatedAt : undefined,
    });
  } catch {
    console.warn("学习记录读取失败：localStorage 中的数据不是有效 JSON，已使用默认进度。");
    return createDefaultProgress();
  }
}

export function loadStudyProgress(): AppProgress {
  if (typeof window === "undefined") {
    return createDefaultProgress();
  }

  return parseProgress(window.localStorage.getItem(STUDY_STORAGE_KEY));
}

export function saveStudyProgress(progress: AppProgress) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(progress));
}

export function clearStudyProgress(): AppProgress {
  const defaultProgress = createDefaultProgress();

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(defaultProgress));
  }

  return defaultProgress;
}

export function exportStudyProgressJson() {
  return JSON.stringify(loadStudyProgress(), null, 2);
}

export function importStudyProgressJson(jsonText: string): AppProgress {
  const parsed = JSON.parse(jsonText) as AppProgress;
  const progress = normalizeProgressDate({
    ...createDefaultProgress(),
    ...parsed,
    records: Object.fromEntries(
      Object.entries(parsed.records ?? {}).map(([key, record]) => [
        key,
        {
          ...record,
          correctStreak: typeof record?.correctStreak === "number" ? record.correctStreak : 0,
        },
      ]),
    ),
    todayStudiedIds: parsed.todayStudiedIds ?? [],
    studyQueueIds: Array.isArray(parsed.studyQueueIds) ? parsed.studyQueueIds : undefined,
    studyQueueMode: typeof parsed.studyQueueMode === "string" ? parsed.studyQueueMode : undefined,
    studyQueueCreatedAt:
      typeof parsed.studyQueueCreatedAt === "string" ? parsed.studyQueueCreatedAt : undefined,
    studyQueueUpdatedAt:
      typeof parsed.studyQueueUpdatedAt === "string" ? parsed.studyQueueUpdatedAt : undefined,
  });

  saveStudyProgress(progress);

  return progress;
}

export function ensureStudyQueue(
  progress: AppProgress,
  words: VocabWord[],
  settings: AppSettings,
): AppProgress {
  const nextQueueMode = getStudyQueueMode({
    studyRange: settings.studyRange,
    studyOrder: settings.studyOrder,
    skipSimpleWords: SKIP_SIMPLE_WORDS,
  });
  const hasValidQueue =
    progress.studyQueueMode === nextQueueMode &&
    Array.isArray(progress.studyQueueIds) &&
    progress.studyQueueIds.length > 0;

  if (hasValidQueue) {
    return progress;
  }

  const studyQueueIds = buildStudyQueueIds(words, {
    studyRange: settings.studyRange,
    studyOrder: settings.studyOrder,
    skipSimpleWords: SKIP_SIMPLE_WORDS,
    records: progress.records,
  });
  const shouldResetIndex = progress.studyQueueMode !== undefined;
  const nextProgress: AppProgress = {
    ...progress,
    // 旧用户第一次升级时尽量保留当前进度；设置变化后再从新队列开头开始。
    currentWordIndex: shouldResetIndex ? 0 : Math.min(progress.currentWordIndex, studyQueueIds.length),
    studyQueueIds,
    studyQueueMode: nextQueueMode,
    studyQueueCreatedAt: new Date().toISOString(),
    studyQueueUpdatedAt: new Date().toISOString(),
  };

  saveStudyProgress(nextProgress);

  return nextProgress;
}

export function markCurrentWordWithoutMoving(
  progress: AppProgress,
  wordId: number,
  status: StudyStatus,
): AppProgress {
  const now = new Date();
  const oldRecord = progress.records[wordId];
  const todayStudiedIds = progress.todayStudiedIds.includes(wordId)
    ? progress.todayStudiedIds
    : [...progress.todayStudiedIds, wordId];

  const nextProgress: AppProgress = {
    ...progress,
    today: getTodayText(now),
    todayStudiedIds,
    studyQueueUpdatedAt: now.toISOString(),
    records: {
      ...progress.records,
      [wordId]: buildUpdatedRecord(oldRecord, wordId, status, now),
    },
  };

  // “模糊 / 不认识”先保存反馈，但不移动索引，让用户看完释义后再手动继续。
  saveStudyProgress(nextProgress);

  return nextProgress;
}

export function moveToNextStudyWord(progress: AppProgress, totalWordCount: number): AppProgress {
  const nextProgress: AppProgress = {
    ...progress,
    currentWordIndex: Math.min(progress.currentWordIndex + 1, totalWordCount),
    studyQueueUpdatedAt: new Date().toISOString(),
  };

  saveStudyProgress(nextProgress);

  return nextProgress;
}

export function restartStudyRound(progress: AppProgress): AppProgress {
  const nextProgress: AppProgress = {
    ...progress,
    currentWordIndex: 0,
    studyQueueUpdatedAt: new Date().toISOString(),
  };

  // 只重置当前队列位置，不清空 known / vague / unknown / wrongCount / reviewCount。
  saveStudyProgress(nextProgress);

  return nextProgress;
}

export function markWordAndMoveNext(
  progress: AppProgress,
  wordId: number,
  status: StudyStatus,
  totalWordCount: number,
): AppProgress {
  const now = new Date();
  const oldRecord = progress.records[wordId];
  const todayStudiedIds = progress.todayStudiedIds.includes(wordId)
    ? progress.todayStudiedIds
    : [...progress.todayStudiedIds, wordId];

  const nextProgress: AppProgress = {
    ...progress,
    currentWordIndex: Math.min(progress.currentWordIndex + 1, totalWordCount),
    today: getTodayText(now),
    todayStudiedIds,
    studyQueueUpdatedAt: now.toISOString(),
    records: {
      ...progress.records,
      [wordId]: buildUpdatedRecord(oldRecord, wordId, status, now),
    },
  };

  // 每次点击按钮后立即保存，避免地铁中途退出或刷新导致进度丢失。
  saveStudyProgress(nextProgress);

  return nextProgress;
}

export function markWrongWordAsKnown(progress: AppProgress, wordId: number): AppProgress {
  const now = new Date();
  const oldRecord = progress.records[wordId];

  if (!oldRecord) {
    return progress;
  }

  const nextProgress: AppProgress = {
    ...progress,
    records: {
      ...progress.records,
      [wordId]: {
        ...oldRecord,
        status: "known",
        wrongCount: 0,
        correctStreak: Math.max(1, oldRecord.correctStreak ?? 0),
        lastReviewAt: now.toISOString(),
        nextReviewAt: getKnownReviewAtAfterSevenDays(now),
      },
    },
  };

  // 错词本点击“已掌握”也要立刻保存，刷新页面后错词不再出现。
  saveStudyProgress(nextProgress);

  return nextProgress;
}

export function markReviewWord(progress: AppProgress, wordId: number, status: StudyStatus): AppProgress {
  const now = new Date();
  const oldRecord = progress.records[wordId];

  if (!oldRecord) {
    return progress;
  }

  const nextProgress: AppProgress = {
    ...progress,
    records: {
      ...progress.records,
      [wordId]: buildUpdatedRecord(oldRecord, wordId, status, now),
    },
  };

  // 复习页每次反馈后立即保存，避免刷新或退出时丢失复习结果。
  saveStudyProgress(nextProgress);

  return nextProgress;
}
