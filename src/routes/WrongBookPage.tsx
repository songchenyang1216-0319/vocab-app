import { useMemo, useState } from "react";
import { wordMap } from "../data/vocab";
import {
  loadStudyProgress,
  markWrongWordAsKnown,
  type WordStudyRecord,
} from "../utils/studyStorage";
import { getWordNote } from "../utils/wordNotesStorage";
import "./WrongBookPage.css";

function WrongBookPage() {
  const [progress, setProgress] = useState(() => loadStudyProgress());
  const wrongWords = useMemo(
    () =>
      Object.values(progress.records)
        .filter((record): record is WordStudyRecord => record.wrongCount > 0)
        .map((record) => ({
          record,
          word: wordMap.get(record.wordId),
        }))
        .filter((item) => item.word)
        .sort((a, b) => b.record.wrongCount - a.record.wrongCount),
    [progress],
  );

  function handleMarkAsKnown(wordId: number) {
    setProgress((currentProgress) => markWrongWordAsKnown(currentProgress, wordId));
  }

  return (
    <section className="page wrong-book-page">
      <header className="wrong-book-header">
        <p className="wrong-book-header__eyebrow">Wrong Book</p>
        <h1 className="wrong-book-header__title">错词本</h1>
        <p className="wrong-book-header__text">优先处理错误次数最多的单词。</p>
      </header>

      {wrongWords.length === 0 ? (
        <div className="wrong-book-empty">
          <h2>目前还没有错词</h2>
          <p>继续背单词，标记“模糊”或“不认识”的词会出现在这里。</p>
        </div>
      ) : (
        <ol className="wrong-word-list">
          {wrongWords.map(({ record, word }) => (
            <li className="wrong-word-card" key={record.wordId}>
              <div className="wrong-word-card__top">
                <h2 className="wrong-word-card__word">
                  {word!.word}
                  {getWordNote(record.wordId) ? (
                    <span className="wrong-word-card__note-badge">有笔记</span>
                  ) : null}
                </h2>
                <div className="wrong-word-card__meta">
                  <span className="wrong-word-card__tag">{word!.tag}</span>
                  <span className="wrong-word-card__count">错 {record.wrongCount} 次</span>
                </div>
              </div>

              <p className="wrong-word-card__meaning">{word!.meaning}</p>
              {getWordNote(record.wordId) ? (
                <p className="wrong-word-card__note">笔记：{getWordNote(record.wordId)!.content}</p>
              ) : null}

              <button
                className="wrong-word-card__button"
                type="button"
                onClick={() => handleMarkAsKnown(record.wordId)}
              >
                已掌握
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default WrongBookPage;
