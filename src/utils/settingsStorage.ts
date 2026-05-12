export const SETTINGS_STORAGE_KEY = "metro-vocab-settings-v1";

export type DailyGoal = 50 | 100 | 150 | 200;
export type DailyNewWordCount = 20 | 30 | 50 | 100;
export type DailyReviewLimit = 30 | 50 | 100 | "不限制";
export type StudyRange = "全部" | "四/六" | "六级" | "四级补充";
export type StudyOrder = "az" | "random" | "unknown-first";

export interface AppSettings {
  dailyGoal: DailyGoal;
  dailyNewWordCount: DailyNewWordCount;
  dailyReviewLimit: DailyReviewLimit;
  studyRange: StudyRange;
  studyOrder: StudyOrder;
}

export const defaultSettings: AppSettings = {
  dailyGoal: 50,
  dailyNewWordCount: 20,
  dailyReviewLimit: 50,
  studyRange: "全部",
  studyOrder: "az",
};

function isDailyGoal(value: unknown): value is DailyGoal {
  return value === 50 || value === 100 || value === 150 || value === 200;
}

function isStudyRange(value: unknown): value is StudyRange {
  return value === "全部" || value === "四/六" || value === "六级" || value === "四级补充";
}

function isDailyNewWordCount(value: unknown): value is DailyNewWordCount {
  return value === 20 || value === 30 || value === 50 || value === 100;
}

function isDailyReviewLimit(value: unknown): value is DailyReviewLimit {
  return value === 30 || value === 50 || value === 100 || value === "不限制";
}

function isStudyOrder(value: unknown): value is StudyOrder {
  return value === "az" || value === "random" || value === "unknown-first";
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const rawValue = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

  if (!rawValue) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<AppSettings>;

    return {
      dailyGoal: isDailyGoal(parsed.dailyGoal) ? parsed.dailyGoal : defaultSettings.dailyGoal,
      dailyNewWordCount: isDailyNewWordCount(parsed.dailyNewWordCount)
        ? parsed.dailyNewWordCount
        : defaultSettings.dailyNewWordCount,
      dailyReviewLimit: isDailyReviewLimit(parsed.dailyReviewLimit)
        ? parsed.dailyReviewLimit
        : defaultSettings.dailyReviewLimit,
      studyRange: isStudyRange(parsed.studyRange) ? parsed.studyRange : defaultSettings.studyRange,
      studyOrder: isStudyOrder(parsed.studyOrder) ? parsed.studyOrder : defaultSettings.studyOrder,
    };
  } catch {
    console.warn("设置读取失败：localStorage 中的设置不是有效 JSON，已使用默认设置。");
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
