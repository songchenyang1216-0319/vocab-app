import { useState } from "react";
import { Link } from "react-router-dom";
import vocabMarkdown from "../data/CET4_CET6_5500_words_CN.md?raw";
import type { StudyStatus } from "../utils/studyStorage";
import {
  ensureStudyQueue,
  loadStudyProgress,
  markCurrentWordWithoutMoving,
  markWordAndMoveNext,
  moveToNextStudyWord,
  restartStudyRound,
} from "../utils/studyStorage";
import { parseVocabMarkdown } from "../utils/parseVocabMarkdown";
import { loadSettings } from "../utils/settingsStorage";
import "./StudyPage.css";

const vocabWords = parseVocabMarkdown(vocabMarkdown);
const wordMap = new Map(vocabWords.map((word) => [word.id, word]));

const actionButtons: Array<{ label: string; status: StudyStatus; className: string }> = [
  { label: "认识", status: "known", className: "study-action-button--known" },
  { label: "模糊", status: "vague", className: "study-action-button--vague" },
  { label: "不认识", status: "unknown", className: "study-action-button--unknown" },
];

function StudyPage() {
  const [progress, setProgress] = useState(() =>
    ensureStudyQueue(loadStudyProgress(), vocabWords, loadSettings()),
  );
  const [showMeaning, setShowMeaning] = useState(false);
  const [waitingAfterWrong, setWaitingAfterWrong] = useState(false);
  const studyQueueIds = progress.studyQueueIds ?? [];
  const currentWordId = studyQueueIds[progress.currentWordIndex];
  const currentWord = currentWordId === undefined ? undefined : wordMap.get(currentWordId);
  const currentDisplayIndex = Math.min(progress.currentWordIndex + 1, studyQueueIds.length);

  function handleMarkWord(status: StudyStatus) {
    if (!currentWord || waitingAfterWrong) {
      return;
    }

    if (status === "vague" || status === "unknown") {
      const nextProgress = markCurrentWordWithoutMoving(progress, currentWord.id, status);

      setProgress(nextProgress);
      setShowMeaning(true);
      setWaitingAfterWrong(true);
      return;
    }

    const nextProgress = markWordAndMoveNext(
      progress,
      currentWord.id,
      status,
      studyQueueIds.length,
    );

    setProgress(nextProgress);
    setShowMeaning(false);
  }

  function handleContinueAfterWrong() {
    const nextProgress = moveToNextStudyWord(progress, studyQueueIds.length);

    setProgress(nextProgress);
    setShowMeaning(false);
    setWaitingAfterWrong(false);
  }

  function handleRestartRound() {
    const nextProgress = restartStudyRound(progress);

    setProgress(nextProgress);
    setShowMeaning(false);
    setWaitingAfterWrong(false);
  }

  if (!currentWord) {
    return (
      <section className="page study-page">
        <header className="study-topbar">
          <div className="study-topbar__left">
            <Link className="study-back-link" aria-label="返回首页" to="/">
              ‹
            </Link>
            <span className="study-progress">{studyQueueIds.length}/{studyQueueIds.length}</span>
          </div>
        </header>

        <div className="study-complete">
          <h1>本轮已完成</h1>
          <p>你已经走到当前学习队列末尾了。可以重新开始本轮，也可以去复习页处理模糊和不认识的单词。</p>
          <button className="study-restart-button" type="button" onClick={handleRestartRound}>
            重新开始本轮
          </button>
          <Link className="primary-link" to="/review">
            去复习
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page study-page">
      <header className="study-topbar">
        <div className="study-topbar__left">
          <Link className="study-back-link" aria-label="返回首页" to="/">
            ‹
          </Link>
          <span className="study-progress">
            {currentDisplayIndex}/{studyQueueIds.length}
          </span>
        </div>

        <div className="study-topbar__tools" aria-label="学习工具">
          <button className="study-tool-button study-tool-button--muted" type="button" disabled>
            ↶
          </button>
          <button className="study-tool-button" type="button" aria-label="收藏">
            ☆
          </button>
          <button className="study-tool-button study-tool-button--text" type="button">
            熟
          </button>
          <button className="study-tool-button" type="button" aria-label="更多">
            …
          </button>
        </div>
      </header>

      <article className="study-card">
        <div className="study-word-block">
          <h1 className="study-card__word">{currentWord.word}</h1>
          <div className="study-meta-row">
            <span className="study-card__tag">{currentWord.tag}</span>
          </div>
        </div>

        <div className="study-meaning" aria-live="polite">
          {showMeaning ? (
            <p className="study-meaning__text">{currentWord.meaning}</p>
          ) : (
            <div className="study-meaning__hidden">
              <p className="study-meaning__placeholder">点击下方按钮后查看释义</p>
              <button
                className="study-toggle-button"
                type="button"
                onClick={() => setShowMeaning(true)}
              >
                显示释义
              </button>
            </div>
          )}
        </div>

        <footer className="study-bottom-area">
          <div className="study-hint">
            <p>瞬间想起词义，选「认识」</p>
            <p>思考后想起词义，选「模糊」</p>
          </div>

          {waitingAfterWrong ? (
            <button className="study-continue-button" type="button" onClick={handleContinueAfterWrong}>
              看完了，继续下一个
            </button>
          ) : (
            <div className="study-actions" aria-label="学习反馈">
              {actionButtons.map((item) => (
                <button
                  className={`study-action-button ${item.className}`}
                  key={item.status}
                  type="button"
                  onClick={() => handleMarkWord(item.status)}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </footer>
      </article>
    </section>
  );
}

export default StudyPage;
