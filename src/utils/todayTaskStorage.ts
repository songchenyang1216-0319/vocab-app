import type { VocabWord } from "../types/vocab";
import type { AppSettings } from "./settingsStorage";
import type { AppProgress } from "./studyStorage";
import { isDueReviewRecord, saveStudyProgress, sortReviewRecords } from "./studyStorage";
import { getStudyWords, SKIP_SIMPLE_WORDS } from "./studyWords";

export const TODAY_TASK_STORAGE_KEY = "daily-study-task-v1";

export interface TodayTask {
  date: string;
  newWordIds: number[];
  reviewWordIds: number[];
  completedNewCount: number;
  completedReviewCount: number;
}

function getTodayText(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createDefaultTask(date = getTodayText()): TodayTask {
  return {
    date,
    newWordIds: [],
    reviewWordIds: [],
    completedNewCount: 0,
    completedReviewCount: 0,
  };
}

function getTaskTotalCount(task: TodayTask) {
  return task.newWordIds.length + task.reviewWordIds.length;
}

function parseTodayTask(rawValue: string | null): TodayTask {
  if (!rawValue) {
    return createDefaultTask();
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<TodayTask>;

    return {
      date: typeof parsed.date === "string" ? parsed.date : getTodayText(),
      newWordIds: Array.isArray(parsed.newWordIds)
        ? parsed.newWordIds.filter((value): value is number => typeof value === "number")
        : [],
      reviewWordIds: Array.isArray(parsed.reviewWordIds)
        ? parsed.reviewWordIds.filter((value): value is number => typeof value === "number")
        : [],
      completedNewCount:
        typeof parsed.completedNewCount === "number" ? parsed.completedNewCount : 0,
      completedReviewCount:
        typeof parsed.completedReviewCount === "number" ? parsed.completedReviewCount : 0,
    };
  } catch {
    console.warn("今日任务读取失败：localStorage 中的数据不是有效 JSON，已重新生成。");
    return createDefaultTask();
  }
}

function saveTodayTask(task: TodayTask) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(TODAY_TASK_STORAGE_KEY, JSON.stringify(task));
}

export function loadTodayTask(): TodayTask {
  if (typeof window === "undefined") {
    return createDefaultTask();
  }

  return parseTodayTask(window.localStorage.getItem(TODAY_TASK_STORAGE_KEY));
}

function buildReviewWordIds(progress: AppProgress, settings: AppSettings) {
  const nowTime = Date.now();
  const dueWordIds = Object.values(progress.records)
    .filter((record) => isDueReviewRecord(record, nowTime))
    .sort(sortReviewRecords)
    .map((record) => record.wordId);

  if (settings.dailyReviewLimit === "不限制") {
    return dueWordIds;
  }

  return dueWordIds.slice(0, settings.dailyReviewLimit);
}

function getStudyPoolIds(words: VocabWord[], settings: AppSettings) {
  return getStudyWords(words, {
    studyRange: settings.studyRange,
    skipSimpleWords: SKIP_SIMPLE_WORDS,
  }).map((word) => word.id);
}

function dedupeWordIds(wordIds: number[]) {
  return [...new Set(wordIds)];
}

function buildNewWordCandidates(progress: AppProgress, settings: AppSettings, words: VocabWord[]) {
  const studyPoolIds = getStudyPoolIds(words, settings);
  const studyQueueIds = progress.studyQueueIds ?? studyPoolIds;
  const queueTail = studyQueueIds.slice(Math.min(progress.currentWordIndex, studyQueueIds.length));
  const unfinishedWordIds = studyPoolIds.filter((wordId) => progress.records[wordId]?.status !== "known");

  return dedupeWordIds([...queueTail, ...unfinishedWordIds, ...studyPoolIds]);
}

function buildNewWordIds(
  progress: AppProgress,
  settings: AppSettings,
  words: VocabWord[],
  excludeWordIds: number[] = [],
) {
  const excludedIds = new Set(excludeWordIds);
  const candidates = buildNewWordCandidates(progress, settings, words).filter(
    (wordId) => !excludedIds.has(wordId),
  );

  return candidates.slice(0, settings.dailyNewWordCount);
}

function createTaskFromCurrentState(
  progress: AppProgress,
  settings: AppSettings,
  words: VocabWord[],
  previousTask?: TodayTask,
) {
  const reviewWordIds = buildReviewWordIds(progress, settings);
  const excludedNewWordIds = [...reviewWordIds, ...(previousTask?.newWordIds ?? [])];
  const newWordIds = buildNewWordIds(progress, settings, words, excludedNewWordIds);
  const nextTask: TodayTask = {
    date: getTodayText(),
    newWordIds,
    reviewWordIds,
    completedNewCount: 0,
    completedReviewCount: 0,
  };
  const studyPoolCount = getStudyPoolIds(words, settings).length;

  if (import.meta.env.DEV) {
    console.log("[today-task]", {
      newWordCount: nextTask.newWordIds.length,
      reviewWordCount: nextTask.reviewWordIds.length,
      studyPoolCount,
      studyRange: settings.studyRange,
      taskTotalCount: getTaskTotalCount(nextTask),
    });
  }

  return nextTask;
}

export function getStudyPoolCount(words: VocabWord[], settings: AppSettings) {
  return getStudyPoolIds(words, settings).length;
}

export function ensureTodayTask(
  progress: AppProgress,
  settings: AppSettings,
  words: VocabWord[],
): TodayTask {
  const currentTask = loadTodayTask();
  const today = getTodayText();

  if (currentTask.date === today) {
    if (getTaskTotalCount(currentTask) > 0) {
      return currentTask;
    }

    const studyPoolCount = getStudyPoolCount(words, settings);

    if (studyPoolCount === 0) {
      return currentTask;
    }

    const regeneratedTask = createTaskFromCurrentState(progress, settings, words);
    saveTodayTask(regeneratedTask);
    return regeneratedTask;
  }

  const nextTask = createTaskFromCurrentState(progress, settings, words);

  saveTodayTask(nextTask);

  // 触发一次学习记录持久化，确保新的一天和任务是同一批本地状态。
  saveStudyProgress(progress);

  return nextTask;
}

export function saveTaskProgress(task: TodayTask) {
  saveTodayTask(task);
  return task;
}

export function clearTodayTask() {
  const nextTask = createDefaultTask();
  saveTodayTask(nextTask);

  return nextTask;
}

export function appendMoreNewWords(
  task: TodayTask,
  progress: AppProgress,
  settings: AppSettings,
  words: VocabWord[],
) {
  const excludedWordIds = [...task.newWordIds, ...task.reviewWordIds];
  let additionalNewWordIds = buildNewWordIds(progress, settings, words, excludedWordIds);

  if (additionalNewWordIds.length === 0) {
    additionalNewWordIds = buildNewWordIds(progress, settings, words, task.reviewWordIds);
  }

  const nextTask: TodayTask = {
    ...task,
    newWordIds: dedupeWordIds([...task.newWordIds, ...additionalNewWordIds]),
  };

  saveTodayTask(nextTask);

  if (import.meta.env.DEV) {
    console.log("[today-task-append]", {
      appendedNewWordCount: additionalNewWordIds.length,
      totalNewWordCount: nextTask.newWordIds.length,
      taskTotalCount: getTaskTotalCount(nextTask),
    });
  }

  return nextTask;
}

export function regenerateTodayTask(
  progress: AppProgress,
  settings: AppSettings,
  words: VocabWord[],
) {
  const nextTask = createTaskFromCurrentState(progress, settings, words);
  saveTodayTask(nextTask);

  return nextTask;
}

export function completeTodayReview(task: TodayTask): TodayTask {
  const nextTask: TodayTask = {
    ...task,
    completedReviewCount: Math.min(task.completedReviewCount + 1, task.reviewWordIds.length),
  };

  saveTodayTask(nextTask);

  return nextTask;
}

export function completeTodayNewWord(task: TodayTask): TodayTask {
  const nextTask: TodayTask = {
    ...task,
    completedNewCount: Math.min(task.completedNewCount + 1, task.newWordIds.length),
  };

  saveTodayTask(nextTask);

  return nextTask;
}

export function getCurrentTaskMode(task: TodayTask): "review" | "new" | "done" {
  if (task.completedReviewCount < task.reviewWordIds.length) {
    return "review";
  }

  if (task.completedNewCount < task.newWordIds.length) {
    return "new";
  }

  return "done";
}
