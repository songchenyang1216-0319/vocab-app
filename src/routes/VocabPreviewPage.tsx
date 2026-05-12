import vocabMarkdown from "../data/CET4_CET6_5500_words_CN.md?raw";
import type { VocabWord } from "../types/vocab";
import { parseVocabMarkdown } from "../utils/parseVocabMarkdown";

let parseErrorMessage = "";
let vocabWords: VocabWord[] = [];

try {
  vocabWords = parseVocabMarkdown(vocabMarkdown);
} catch (error) {
  parseErrorMessage = error instanceof Error ? error.message : "词表解析失败：未知错误。";
  console.error(parseErrorMessage);
}

function VocabPreviewPage() {
  const firstTwentyWords = vocabWords.slice(0, 20);

  return (
    <section className="page">
      <header className="page__header">
        <p className="page__eyebrow">Vocab Preview</p>
        <h1 className="page__title">词表解析测试</h1>
      </header>

      {parseErrorMessage ? (
        <div className="panel panel--danger">
          <h2 className="panel__title">解析失败</h2>
          <pre className="error-text">{parseErrorMessage}</pre>
        </div>
      ) : (
        <>
          <div className="panel">
            <h2 className="panel__title">解析结果</h2>
            <p className="panel__text">
              控制台已打印解析数量。本页先展示前 20 个单词，方便确认格式是否正确。
            </p>
            <p className="vocab-count">共解析 {vocabWords.length} 条</p>
          </div>

          <ol className="word-list">
            {firstTwentyWords.map((item) => (
              <li className="word-list__item" key={item.id}>
                <div className="word-list__header">
                  <strong>
                    {String(item.id).padStart(4, "0")}. {item.word}
                  </strong>
                  <span>{item.tag}</span>
                </div>
                <p>{item.meaning}</p>
                <small>首字母：{item.alphabet}</small>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}

export default VocabPreviewPage;
