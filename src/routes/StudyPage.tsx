import { useState } from "react";
import { Link } from "react-router-dom";
import vocabMarkdown from "../data/CET4_CET6_5500_words_CN.md?raw";
import type { StudyStatus } from "../utils/studyStorage";
import { loadStudyProgress, markWordAndMoveNext } from "../utils/studyStorage";
import { parseVocabMarkdown } from "../utils/parseVocabMarkdown";
import "./StudyPage.css";

const vocabWords = parseVocabMarkdown(vocabMarkdown);

const actionButtons: Array<{ label: string; status: StudyStatus; className: string }> = [
  { label: "认识", status: "known", className: "study-action-button--known" },
  { label: "模糊", status: "vague", className: "study-action-button--vague" },
  { label: "不认识", status: "unknown", className: "study-action-button--unknown" },
];

function StudyPage() {
  const [progress, setProgress] = useState(() => loadStudyProgress());
  const [showMeaning, setShowMeaning] = useState(false);
  const currentWord = vocabWords[progress.currentWordIndex];
  const currentDisplayIndex = Math.min(progress.currentWordIndex + 1, vocabWords.length);

  function handleMarkWord(status: StudyStatus) {
    if (!currentWord) {
      return;
    }

    const nextProgress = markWordAndMoveNext(
      progress,
      currentWord.id,
      status,
      vocabWords.length,
    );

    setProgress(nextProgress);
    setShowMeaning(false);
  }

  if (!currentWord) {
    return (
      <section className="page study-page">
        <div className="study-topbar">
          <Link className="study-back-link" to="/">
            返回首页
          </Link>
          <span className="study-progress">{vocabWords.length} / {vocabWords.length}</span>
        </div>

        <div className="study-complete">
          <h1>已经背完全部单词</h1>
          <p>你已经走到词表末尾了。后续可以去复习页处理模糊和不认识的单词。</p>
          <Link className="primary-link" to="/review">
            去复习
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page study-page">
      <div className="study-topbar">
        <Link className="study-back-link" to="/">
          返回首页
        </Link>
        <span className="study-progress">
          {currentDisplayIndex} / {vocabWords.length}
        </span>
      </div>

      <article className="study-card">
        <span className="study-card__tag">{currentWord.tag}</span>
        <h1 className="study-card__word">{currentWord.word}</h1>

        <div className="study-meaning">
          {showMeaning ? (
            <p className="study-meaning__text">{currentWord.meaning}</p>
          ) : (
            <p className="study-meaning__placeholder">先看英文，想好后再显示释义。</p>
          )}

          <button
            className="study-toggle-button"
            type="button"
            onClick={() => setShowMeaning((value) => !value)}
          >
            {showMeaning ? "隐藏释义" : "显示释义"}
          </button>
        </div>

        <div className="study-actions" aria-label="学习反馈">
          {actionButtons.map((item) => (
            <button
              className={`study-action-button ${item.className}`}
              key={item.status}
              type="button"
              onClick={() => handleMarkWord(item.status)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </article>
    </section>
  );
}

export default StudyPage;
