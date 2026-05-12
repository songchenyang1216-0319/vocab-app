export const STUDY_STORAGE_KEY = "metro-vocab-progress-v1";

export type StudyStatus = "known" | "vague" | "unknown";

export interface WordStudyRecord {
  wordId: number;
  status: StudyStatus;
  reviewCount: number;
  wrongCount: number;
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

function getNextReviewAt(status: StudyStatus, now: Date) {
  const next = new Date(now);

  if (status === "known") {
    next.setDate(next.getDate() + 3);
  }

  if (status === "vague") {
    next.setDate(next.getDate() + 1);
  }

  if (status === "unknown") {
    next.setMinutes(next.getMinutes() + 30);
  }

  return next.toISOString();
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
      records: parsed.records ?? {},
      todayStudiedIds: parsed.todayStudiedIds ?? [],
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
    records: parsed.records ?? {},
    todayStudiedIds: parsed.todayStudiedIds ?? [],
  });

  saveStudyProgress(progress);

  return progress;
}

export function markWordAndMoveNext(
  progress: AppProgress,
  wordId: number,
  status: StudyStatus,
  totalWordCount: number,
): AppProgress {
  const now = new Date();
  const oldRecord = progress.records[wordId];
  const shouldAddWrongCount = status === "vague" || status === "unknown";
  const todayStudiedIds = progress.todayStudiedIds.includes(wordId)
    ? progress.todayStudiedIds
    : [...progress.todayStudiedIds, wordId];

  const nextProgress: AppProgress = {
    ...progress,
    currentWordIndex: Math.min(progress.currentWordIndex + 1, totalWordCount),
    today: getTodayText(now),
    todayStudiedIds,
    records: {
      ...progress.records,
      [wordId]: {
        wordId,
        status,
        reviewCount: (oldRecord?.reviewCount ?? 0) + 1,
        wrongCount: (oldRecord?.wrongCount ?? 0) + (shouldAddWrongCount ? 1 : 0),
        lastReviewAt: now.toISOString(),
        nextReviewAt: getNextReviewAt(status, now),
      },
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
        lastReviewAt: now.toISOString(),
        nextReviewAt: getKnownReviewAtAfterSevenDays(now),
      },
    },
  };

  // 错词本点击“已掌握”也要立刻保存，刷新页面后错词不再出现。
  saveStudyProgress(nextProgress);

  return nextProgress;
}
