export interface StudyTrendItem {
  date: string;
  completedCount: number;
}

export interface StudyStats {
  learnedCount: number;
  knownCount: number;
  vagueCount: number;
  unknownCount: number;
  wrongCount: number;
  vocabBookCount: number;
  dueReviewCount: number;
  todayNewCompleted: number;
  todayNewTotal: number;
  todayReviewCompleted: number;
  todayReviewTotal: number;
  todayTotalCompleted: number;
  todayTotal: number;
  masteryRate: number;
  streakDays: number;
  recentSevenDays: StudyTrendItem[];
}
