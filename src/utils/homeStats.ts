import { STUDY_STORAGE_KEY, type StudyStatus } from "./studyStorage";

interface StoredStudyRecord {
  wordId: number;
  status: StudyStatus;
}

interface StoredProgress {
  todayStudiedIds?: number[];
  records?: Record<string, StoredStudyRecord>;
}

export interface HomeStats {
  todayStudiedCount: number;
  knownCount: number;
  wrongCount: number;
}

function isStoredStudyRecord(value: unknown): value is StoredStudyRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<StoredStudyRecord>;

  return (
    typeof record.wordId === "number" &&
    (record.status === "known" || record.status === "vague" || record.status === "unknown")
  );
}

function parseStoredProgress(rawValue: string | null): StoredProgress | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as StoredProgress;

    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    console.warn("学习记录读取失败：localStorage 中的数据不是有效 JSON。");
    return null;
  }
}

export function readHomeStats(): HomeStats {
  const defaultStats: HomeStats = {
    todayStudiedCount: 0,
    knownCount: 0,
    wrongCount: 0,
  };

  if (typeof window === "undefined") {
    return defaultStats;
  }

  const progress = parseStoredProgress(window.localStorage.getItem(STUDY_STORAGE_KEY));

  if (!progress) {
    return defaultStats;
  }

  const records = Object.values(progress.records ?? {}).filter(isStoredStudyRecord);

  // 首页只关心几个大数字，具体学习逻辑后续在背单词页里实现。
  return {
    todayStudiedCount: progress.todayStudiedIds?.length ?? 0,
    knownCount: records.filter((record) => record.status === "known").length,
    wrongCount: records.filter((record) => record.status === "unknown").length,
  };
}
