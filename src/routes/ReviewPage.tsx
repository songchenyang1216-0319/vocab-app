import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import vocabMarkdown from "../data/CET4_CET6_5500_words_CN.md?raw";
import { parseVocabMarkdown } from "../utils/parseVocabMarkdown";
import {
  loadStudyProgress,
  markReviewWord,
  type StudyStatus,
  type WordStudyRecord,
} from "../utils/studyStorage";
import "./ReviewPage.css";

const vocabWords = parseVocabMarkdown(vocabMarkdown);
const wordMap = new Map(vocabWords.map((word) => [word.id, word]));

const reviewActions: Array<{ label: string; status: StudyStatus; className: string }> = [
  { label: "记住了", status: "known", className: "review-action-button--known" },
  { label: "还模糊", status: "vague", className: "review-action-button--vague" },
  { label: "没记住", status: "unknown", className: "review-action-button--unknown" },
];

function getStatusPriority(status: StudyStatus) {
  if (status === "unknown") {
    return 2;
  }

  if (status === "vague") {
    return 1;
  }

  return 0;
}

function isDueReviewRecord(record: WordStudyRecord, nowTime: number) {
  const nextReviewTime = new Date(record.nextReviewAt).getTime();

  return Number.isFinite(nextReviewTime) && nextReviewTime <= nowTime;
}

function sortReviewRecords(left: WordStudyRecord, right: WordStudyRecord) {
  const wrongCountDiff = right.wrongCount - left.wrongCount;

  if (wrongCountDiff !== 0) {
    return wrongCountDiff;
  }

  const statusDiff = getStatusPriority(right.status) - getStatusPriority(left.status);

  if (statusDiff !== 0) {
    return statusDiff;
  }

  return new Date(left.nextReviewAt).getTime() - new Date(right.nextReviewAt).getTime();
}

function ReviewPage() {
  const [progress, setProgress] = useState(() => loadStudyProgress());
  const [completedReviewCount, setCompletedReviewCount] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const dueReviewItems = useMemo(() => {
    const nowTime = Date.now();

    return Object.values(progress.records)
      .filter((record) => isDueReviewRecord(record, nowTime))
      .sort(sortReviewRecords)
      .map((record) => ({
        record,
        word: wordMap.get(record.wordId),
      }))
      .filter((item) => item.word);
  }, [progress]);
  const totalReviewCount = completedReviewCount + dueReviewItems.length;
  const currentReviewItem = dueReviewItems[0];
  const currentWord = currentReviewItem?.word;
  const currentDisplayIndex = Math.min(completedReviewCount + 1, totalReviewCount);

  function handleReview(status: StudyStatus) {
    if (!currentReviewItem) {
      return;
    }

    const nextProgress = markReviewWord(progress, currentReviewItem.record.wordId, status);

    setProgress(nextProgress);
    setShowMeaning(false);
    setCompletedReviewCount((count) => count + 1);
  }

  if (!currentReviewItem || !currentWord) {
    return (
      <section className="page review-page">
        <div className="review-topbar">
          <Link className="review-back-link" to="/">
            返回首页
          </Link>
          <span className="review-progress">0 / 0</span>
        </div>

        <div className="review-empty">
          <h1>今天没有需要复习的单词</h1>
          <p>到期复习的单词会自动出现在这里。可以先去背新词。</p>
          <Link className="primary-link" to="/study">
            去背单词
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page review-page">
      <div className="review-topbar">
        <Link className="review-back-link" to="/">
          返回首页
        </Link>
        <span className="review-progress">
          {currentDisplayIndex} / {dueReviewItems.length}
        </span>
      </div>

      <div className="review-summary">
        <p className="review-summary__label">今日待复习</p>
        <p className="review-summary__value">{dueReviewItems.length} 个</p>
      </div>

      <article className="review-card">
        <span className="review-card__tag">{currentWord.tag}</span>
        <h1 className="review-card__word">{currentWord.word}</h1>

        <div className="review-meaning">
          {showMeaning ? (
            <p className="review-meaning__text">{currentWord.meaning}</p>
          ) : (
            <p className="review-meaning__placeholder">先回忆释义，再点开确认。</p>
          )}

          <button
            className="review-toggle-button"
            type="button"
            onClick={() => setShowMeaning((value) => !value)}
          >
            {showMeaning ? "隐藏释义" : "显示释义"}
          </button>
        </div>

        <div className="review-actions" aria-label="复习反馈">
          {reviewActions.map((item) => (
            <button
              className={`review-action-button ${item.className}`}
              key={item.status}
              type="button"
              onClick={() => handleReview(item.status)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}

export default ReviewPage;
