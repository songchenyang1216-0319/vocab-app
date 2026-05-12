import { useMemo, useState } from "react";
import vocabMarkdown from "../data/CET4_CET6_5500_words_CN.md?raw";
import { parseVocabMarkdown } from "../utils/parseVocabMarkdown";
import { getVocabBookItems, removeFromVocabBook } from "../utils/vocabBookStorage";
import "./VocabBookPage.css";

const vocabWords = parseVocabMarkdown(vocabMarkdown);
const wordMap = new Map(vocabWords.map((word) => [word.id, word]));

function formatAddedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "时间未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function VocabBookPage() {
  const [items, setItems] = useState(() => getVocabBookItems());
  const vocabBookWords = useMemo(
    () =>
      items
        .map((item) => ({
          item,
          word: wordMap.get(item.wordId),
        }))
        .filter((entry) => entry.word)
        .sort((a, b) => new Date(b.item.addedAt).getTime() - new Date(a.item.addedAt).getTime()),
    [items],
  );

  function handleRemove(wordId: number) {
    setItems(removeFromVocabBook(wordId));
  }

  return (
    <section className="page vocab-book-page">
      <header className="vocab-book-header">
        <p className="vocab-book-header__eyebrow">Vocab Book</p>
        <h1 className="vocab-book-header__title">生词本</h1>
        <p className="vocab-book-header__text">把一时想不起来的词先收进来，空下来再集中看。</p>
      </header>

      {vocabBookWords.length === 0 ? (
        <div className="vocab-book-empty">
          <h2>还没有加入生词本的单词</h2>
          <p>在背单词页点击“不认识”后，可以选择把当前单词加入生词本。</p>
        </div>
      ) : (
        <ol className="vocab-book-list">
          {vocabBookWords.map(({ item, word }) => (
            <li className="vocab-book-card" key={item.wordId}>
              <div className="vocab-book-card__top">
                <div>
                  <h2 className="vocab-book-card__word">{word!.word}</h2>
                  <p className="vocab-book-card__time">加入时间：{formatAddedAt(item.addedAt)}</p>
                </div>
                <span className="vocab-book-card__tag">{word!.tag}</span>
              </div>

              <p className="vocab-book-card__meaning">{word!.meaning}</p>

              <button
                className="vocab-book-card__button"
                type="button"
                onClick={() => handleRemove(item.wordId)}
              >
                移出生词本
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default VocabBookPage;
