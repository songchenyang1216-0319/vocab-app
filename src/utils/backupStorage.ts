import type { StudyStats } from "../types/studyStats";
import { SETTINGS_STORAGE_KEY, defaultSettings, saveSettings, type AppSettings } from "./settingsStorage";
import {
  clearStudyProgress,
  importStudyProgressJson,
  loadStudyProgress,
  STUDY_STORAGE_KEY,
  type AppProgress,
} from "./studyStorage";
import { getStudyStats } from "./studyStats";
import { clearTodayTask, loadTodayTask, saveTaskProgress, TODAY_TASK_STORAGE_KEY, type TodayTask } from "./todayTaskStorage";
import { clearVocabBook, getVocabBookItems, VOCAB_BOOK_STORAGE_KEY } from "./vocabBookStorage";
import {
  clearAllWordNotes,
  getAllWordNotes,
  WORD_NOTES_STORAGE_KEY,
} from "./wordNotesStorage";

export const BACKUP_APP_NAME = "cet-vocab-app";
export const BACKUP_SCHEMA_VERSION = "1.0";

interface BackupPayload {
  appName: string;
  version: string;
  exportedAt: string;
  data: {
    studyRecords: AppProgress;
    dailyTasks: TodayTask;
    vocabBookItems: ReturnType<typeof getVocabBookItems>;
    wordNotes: ReturnType<typeof getAllWordNotes>;
    settings: AppSettings;
    studyStatsSnapshot: StudyStats;
    otherLocalStorageKeys: Record<string, never>;
  };
}

function formatDateText(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeSettings(value: unknown): AppSettings {
  if (!isObject(value)) {
    return defaultSettings;
  }

  return {
    dailyGoal:
      value.dailyGoal === 50 || value.dailyGoal === 100 || value.dailyGoal === 150 || value.dailyGoal === 200
        ? value.dailyGoal
        : defaultSettings.dailyGoal,
    dailyNewWordCount:
      value.dailyNewWordCount === 20 ||
      value.dailyNewWordCount === 30 ||
      value.dailyNewWordCount === 50 ||
      value.dailyNewWordCount === 100
        ? value.dailyNewWordCount
        : defaultSettings.dailyNewWordCount,
    dailyReviewLimit:
      value.dailyReviewLimit === 30 ||
      value.dailyReviewLimit === 50 ||
      value.dailyReviewLimit === 100 ||
      value.dailyReviewLimit === "不限制"
        ? value.dailyReviewLimit
        : defaultSettings.dailyReviewLimit,
    studyRange:
      value.studyRange === "全部" ||
      value.studyRange === "四/六" ||
      value.studyRange === "六级" ||
      value.studyRange === "四级补充"
        ? value.studyRange
        : defaultSettings.studyRange,
    studyOrder:
      value.studyOrder === "az" || value.studyOrder === "random" || value.studyOrder === "unknown-first"
        ? value.studyOrder
        : defaultSettings.studyOrder,
  };
}

function getBackupPayload(): BackupPayload {
  return {
    appName: BACKUP_APP_NAME,
    version: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      studyRecords: loadStudyProgress(),
      dailyTasks: loadTodayTask(),
      vocabBookItems: getVocabBookItems(),
      wordNotes: getAllWordNotes(),
      settings:
        typeof window === "undefined"
          ? defaultSettings
          : normalizeSettings(JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}")),
      studyStatsSnapshot: getStudyStats(),
      otherLocalStorageKeys: {},
    },
  };
}

export function exportBackupData() {
  return getBackupPayload();
}

export function downloadBackupFile() {
  const payload = exportBackupData();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `vocab-app-backup-${formatDateText()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function validateBackupData(json: unknown): json is BackupPayload {
  if (!isObject(json)) {
    return false;
  }

  if (json.appName !== BACKUP_APP_NAME) {
    return false;
  }

  if (typeof json.version !== "string") {
    return false;
  }

  if (!isObject(json.data)) {
    return false;
  }

  return true;
}

export function importBackupData(json: unknown) {
  if (!validateBackupData(json)) {
    throw new Error("这不是当前 App 的有效备份文件。");
  }

  const data = json.data;
  const studyRecordsJson = JSON.stringify(isObject(data.studyRecords) ? data.studyRecords : {});
  const settings = normalizeSettings(data.settings);
  const dailyTasks = isObject(data.dailyTasks) ? data.dailyTasks : ({} as Record<string, unknown>);
  const vocabBookItems = Array.isArray(data.vocabBookItems) ? data.vocabBookItems : [];
  const wordNotes = Array.isArray(data.wordNotes) ? data.wordNotes : [];

  importStudyProgressJson(studyRecordsJson);
  saveSettings(settings);
  saveTaskProgress({
    date: typeof dailyTasks.date === "string" ? dailyTasks.date : "",
    newWordIds: Array.isArray(dailyTasks.newWordIds)
      ? dailyTasks.newWordIds.filter((value): value is number => typeof value === "number")
      : [],
    reviewWordIds: Array.isArray(dailyTasks.reviewWordIds)
      ? dailyTasks.reviewWordIds.filter((value): value is number => typeof value === "number")
      : [],
    completedNewCount: typeof dailyTasks.completedNewCount === "number" ? dailyTasks.completedNewCount : 0,
    completedReviewCount:
      typeof dailyTasks.completedReviewCount === "number" ? dailyTasks.completedReviewCount : 0,
  });

  if (typeof window !== "undefined") {
    window.localStorage.setItem(VOCAB_BOOK_STORAGE_KEY, JSON.stringify(vocabBookItems));
    window.localStorage.setItem(WORD_NOTES_STORAGE_KEY, JSON.stringify(wordNotes));
  }
}

export function clearAllLearningData() {
  clearStudyProgress();
  clearTodayTask();
  clearVocabBook();
  clearAllWordNotes();
  saveSettings(defaultSettings);

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STUDY_STORAGE_KEY);
    window.localStorage.removeItem(TODAY_TASK_STORAGE_KEY);
    window.localStorage.removeItem(VOCAB_BOOK_STORAGE_KEY);
    window.localStorage.removeItem(WORD_NOTES_STORAGE_KEY);
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  }
}
