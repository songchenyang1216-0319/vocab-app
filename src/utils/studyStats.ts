import type { StudyStats, StudyTrendItem } from "../types/studyStats";
import { getVocabBookItems } from "./vocabBookStorage";
import { loadTodayTask } from "./todayTaskStorage";
import { isDueReviewRecord, loadStudyProgress } from "./studyStorage";

function getDefaultStats(): StudyStats {
  return {
    learnedCount: 0,
    knownCount: 0,
    vagueCount: 0,
    unknownCount: 0,
    wrongCount: 0,
    vocabBookCount: 0,
    dueReviewCount: 0,
    todayNewCompleted: 0,
    todayNewTotal: 0,
    todayReviewCompleted: 0,
    todayReviewTotal: 0,
    todayTotalCompleted: 0,
    todayTotal: 0,
    masteryRate: 0,
    streakDays: 0,
    recentSevenDays: [],
  };
}

function getRecentSevenDaysTrend(): StudyTrendItem[] {
  const task = loadTodayTask();
  const completedCount = (task.completedNewCount ?? 0) + (task.completedReviewCount ?? 0);

  if (!task.date || completedCount <= 0) {
    return [];
  }

  return [
    {
      date: task.date,
      completedCount,
    },
  ];
}

export function getStudyStats(): StudyStats {
  const progress = loadStudyProgress();
  const task = loadTodayTask();
  const vocabBookCount = getVocabBookItems().length;
  const records = Object.values(progress.records ?? {});

  if (records.length === 0) {
    return {
      ...getDefaultStats(),
      vocabBookCount,
      todayNewCompleted: task.completedNewCount ?? 0,
      todayNewTotal: task.newWordIds?.length ?? 0,
      todayReviewCompleted: task.completedReviewCount ?? 0,
      todayReviewTotal: task.reviewWordIds?.length ?? 0,
      todayTotalCompleted: (task.completedNewCount ?? 0) + (task.completedReviewCount ?? 0),
      todayTotal: (task.newWordIds?.length ?? 0) + (task.reviewWordIds?.length ?? 0),
      recentSevenDays: getRecentSevenDaysTrend(),
      streakDays:
        (task.completedNewCount ?? 0) + (task.completedReviewCount ?? 0) > 0 ? 1 : 0,
    };
  }

  const knownCount = records.filter((record) => record.status === "known").length;
  const vagueCount = records.filter((record) => record.status === "vague").length;
  const unknownCount = records.filter((record) => record.status === "unknown").length;
  const wrongCount = records.filter((record) => (record.wrongCount ?? 0) > 0).length;
  const dueReviewCount = records.filter((record) => isDueReviewRecord(record, Date.now())).length;
  const learnedCount = records.length;
  const todayNewCompleted = task.completedNewCount ?? 0;
  const todayNewTotal = task.newWordIds?.length ?? 0;
  const todayReviewCompleted = task.completedReviewCount ?? 0;
  const todayReviewTotal = task.reviewWordIds?.length ?? 0;
  const todayTotalCompleted = todayNewCompleted + todayReviewCompleted;
  const todayTotal = todayNewTotal + todayReviewTotal;

  return {
    learnedCount,
    knownCount,
    vagueCount,
    unknownCount,
    wrongCount,
    vocabBookCount,
    dueReviewCount,
    todayNewCompleted,
    todayNewTotal,
    todayReviewCompleted,
    todayReviewTotal,
    todayTotalCompleted,
    todayTotal,
    masteryRate: learnedCount === 0 ? 0 : knownCount / learnedCount,
    streakDays: todayTotalCompleted > 0 ? 1 : 0,
    recentSevenDays: getRecentSevenDaysTrend(),
  };
}
