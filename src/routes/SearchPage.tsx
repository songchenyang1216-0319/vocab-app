import { useMemo, useState } from "react";
import vocabMarkdown from "../data/CET4_CET6_5500_words_CN.md?raw";
import type { VocabTag } from "../types/vocab";
import { parseVocabMarkdown } from "../utils/parseVocabMarkdown";
import { loadStudyProgress, type StudyStatus, type WordStudyRecord } from "../utils/studyStorage";
import "./SearchPage.css";

type TagFilter = "全部" | VocabTag;

const vocabWords = parseVocabMarkdown(vocabMarkdown);
const tagFilters: TagFilter[] = ["全部", "四/六", "六级", "四级补充"];
const statusText: Record<StudyStatus, string> = {
  known: "认识",
  vague: "模糊",
  unknown: "不认识",
};

function formatTime(value?: string) {
  if (!value) {
    return "暂无";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "暂无";
  }

  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRecordValue(record: WordStudyRecord | undefined, key: keyof WordStudyRecord) {
  if (!record) {
    return "暂无";
  }

  const value = record[key];

  if (key === "status") {
    return statusText[value as StudyStatus];
  }

  if (key === "lastReviewAt" || key === "nextReviewAt") {
    return formatTime(value as string);
  }

  return String(value);
}

function SearchPage() {
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState<TagFilter>("全部");
  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);
  const [progress] = useState(() => loadStudyProgress());
  const keyword = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!keyword) {
      return [];
    }

    return vocabWords
      .filter((item) => tagFilter === "全部" || item.tag === tagFilter)
      .filter((item) => {
        const wordText = item.word.toLowerCase();
        const meaningText = item.meaning.toLowerCase();

        // 英文查 word，中文查 meaning；统一用 includes 做模糊匹配。
        return wordText.includes(keyword) || meaningText.includes(keyword);
      })
      .slice(0, 80);
  }, [keyword, tagFilter]);

  return (
    <section className="page search-page">
      <header className="search-header">
        <p className="search-header__eyebrow">Search</p>
        <h1 className="search-header__title">搜索单词</h1>
      </header>

      <input
        className="search-input"
        placeholder="输入英文或中文释义"
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setExpandedWordId(null);
        }}
      />

      <div className="tag-filter" aria-label="词表标签筛选">
        {tagFilters.map((item) => (
          <button
            className={
              item === tagFilter
                ? "tag-filter__button tag-filter__button--active"
                : "tag-filter__button"
            }
            key={item}
            type="button"
            onClick={() => {
              setTagFilter(item);
              setExpandedWordId(null);
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {keyword ? (
        <p className="search-summary">
          找到 {results.length} 条结果{results.length === 80 ? "，已显示前 80 条" : ""}
        </p>
      ) : null}

      {!keyword ? (
        <div className="search-empty">输入英文单词或中文释义即可搜索。</div>
      ) : results.length === 0 ? (
        <div className="search-empty">没有找到匹配的单词。</div>
      ) : (
        <ol className="search-result-list">
          {results.map((item) => {
            const record = progress.records[item.id];
            const isExpanded = expandedWordId === item.id;

            return (
              <li className="search-result-card" key={item.id}>
                <button
                  className="search-result-card__button"
                  type="button"
                  onClick={() => setExpandedWordId(isExpanded ? null : item.id)}
                >
                  <span className="search-result-card__top">
                    <span className="search-result-card__word">{item.word}</span>
                    <span className="search-result-card__tag">{item.tag}</span>
                  </span>
                  <span className="search-result-card__meaning">{item.meaning}</span>
                </button>

                {isExpanded ? (
                  <div className="search-result-card__details">
                    <div className="search-detail">
                      <span className="search-detail__label">学习状态</span>
                      <span className="search-detail__value">
                        {getRecordValue(record, "status")}
                      </span>
                    </div>
                    <div className="search-detail">
                      <span className="search-detail__label">复习次数</span>
                      <span className="search-detail__value">
                        {getRecordValue(record, "reviewCount")}
                      </span>
                    </div>
                    <div className="search-detail">
                      <span className="search-detail__label">错误次数</span>
                      <span className="search-detail__value">
                        {getRecordValue(record, "wrongCount")}
                      </span>
                    </div>
                    <div className="search-detail">
                      <span className="search-detail__label">连续认识</span>
                      <span className="search-detail__value">
                        {getRecordValue(record, "correctStreak")}
                      </span>
                    </div>
                    <div className="search-detail">
                      <span className="search-detail__label">上次复习</span>
                      <span className="search-detail__value">
                        {getRecordValue(record, "lastReviewAt")}
                      </span>
                    </div>
                    <div className="search-detail">
                      <span className="search-detail__label">下次复习</span>
                      <span className="search-detail__value">
                        {getRecordValue(record, "nextReviewAt")}
                      </span>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export default SearchPage;
