import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import WordNoteEditor from "../components/WordNoteEditor";
import { wordMap } from "../data/vocab";
import {
  isDueReviewRecord,
  loadStudyProgress,
  markReviewWord,
  sortReviewRecords,
  type StudyStatus,
} from "../utils/studyStorage";
import { hasWordNote } from "../utils/wordNotesStorage";
import "./ReviewPage.css";

const reviewActions: Array<{ label: string; status: StudyStatus; className: string }> = [
  { label: "记住了", status: "known", className: "review-action-button--known" },
  { label: "还模糊", status: "vague", className: "review-action-button--vague" },
  { label: "没记住", status: "unknown", className: "review-action-button--unknown" },
];

function ReviewPage() {
  const [initialReviewProgress] = useState(() => loadStudyProgress());
  const [initialReviewTotal] = useState(() => {
    const nowTime = Date.now();

    return Object.values(initialReviewProgress.records).filter((record) =>
      isDueReviewRecord(record, nowTime),
    ).length;
  });
  const [progress, setProgress] = useState(() => initialReviewProgress);
  const [completedReviewCount, setCompletedReviewCount] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [, setNoteVersion] = useState(0);
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
  const currentReviewItem = dueReviewItems[0];
  const currentWord = currentReviewItem?.word;
  const currentDisplayIndex =
    initialReviewTotal === 0 ? 0 : Math.min(completedReviewCount + 1, initialReviewTotal);

  function handleReview(status: StudyStatus) {
    if (!currentReviewItem) {
      return;
    }

    const nextProgress = markReviewWord(progress, currentReviewItem.record.wordId, status);

    setProgress(nextProgress);
    setShowMeaning(false);
    setShowNoteEditor(false);
    setCompletedReviewCount((count) => count + 1);
  }

  if (!currentReviewItem || !currentWord) {
    return (
      <section className="page review-page">
        <div className="review-topbar">
          <Link className="review-back-link" to="/">
            返回首页
          </Link>
          <span className="review-progress">
            {initialReviewTotal > 0 ? `${initialReviewTotal} / ${initialReviewTotal}` : "0 / 0"}
          </span>
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
          {currentDisplayIndex} / {initialReviewTotal}
        </span>
      </div>

      <div className="review-summary">
        <p className="review-summary__label">今日待复习</p>
        <p className="review-summary__value">{dueReviewItems.length} 个</p>
      </div>

      <article className="review-card">
        <div className="review-card__meta">
          <span className="review-card__tag">{currentWord.tag}</span>
          <button
            className={hasWordNote(currentWord.id) ? "review-note-toggle review-note-toggle--active" : "review-note-toggle"}
            type="button"
            onClick={() => setShowNoteEditor((value) => !value)}
          >
            {hasWordNote(currentWord.id) ? "有笔记" : "笔记"}
          </button>
        </div>
        <h1 className="review-card__word">{currentWord.word}</h1>

        {showNoteEditor ? (
          <WordNoteEditor
            wordId={currentWord.id}
            onChanged={() => setNoteVersion((version) => version + 1)}
          />
        ) : null}

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
