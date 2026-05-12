import { useMemo, useState } from "react";
import WordNoteEditor from "../components/WordNoteEditor";
import { wordMap } from "../data/vocab";
import { deleteWordNote, getAllWordNotes } from "../utils/wordNotesStorage";
import "./NotesPage.css";

function formatUpdatedAt(value: string) {
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

function NotesPage() {
  const [notes, setNotes] = useState(() => getAllWordNotes());
  const [expandedWordId, setExpandedWordId] = useState<number | null>(null);
  const noteItems = useMemo(
    () =>
      notes
        .map((note) => ({
          note,
          word: wordMap.get(note.wordId),
        }))
        .filter((item) => item.word)
        .sort((left, right) => new Date(right.note.updatedAt).getTime() - new Date(left.note.updatedAt).getTime()),
    [notes],
  );

  function reloadNotes() {
    setNotes(getAllWordNotes());
  }

  function handleDelete(wordId: number) {
    const confirmed = window.confirm("确定要删除这个单词的个人笔记吗？");

    if (!confirmed) {
      return;
    }

    deleteWordNote(wordId);
    reloadNotes();
    setExpandedWordId(null);
  }

  return (
    <section className="page notes-page">
      <header className="notes-header">
        <p className="notes-header__eyebrow">Notes</p>
        <h1 className="notes-header__title">我的笔记</h1>
      </header>

      {noteItems.length === 0 ? (
        <div className="notes-empty">
          <h2>还没有个人笔记</h2>
          <p>在背单词页、复习页或搜索页打开“笔记”，写下自己的记忆方法。</p>
        </div>
      ) : (
        <ol className="notes-list">
          {noteItems.map(({ note, word }) => {
            const isExpanded = expandedWordId === note.wordId;

            return (
              <li className="notes-card" key={note.wordId}>
                <button
                  className="notes-card__main"
                  type="button"
                  onClick={() => setExpandedWordId(isExpanded ? null : note.wordId)}
                >
                  <span className="notes-card__top">
                    <span className="notes-card__word">{word!.word}</span>
                    <span className="notes-card__tag">{word!.tag}</span>
                  </span>
                  <span className="notes-card__meaning">{word!.meaning}</span>
                  <span className="notes-card__preview">{note.content}</span>
                  <span className="notes-card__time">更新时间：{formatUpdatedAt(note.updatedAt)}</span>
                </button>

                {isExpanded ? (
                  <div className="notes-card__details">
                    <WordNoteEditor wordId={note.wordId} onChanged={reloadNotes} />
                    <button
                      className="notes-card__delete"
                      type="button"
                      onClick={() => handleDelete(note.wordId)}
                    >
                      删除笔记
                    </button>
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

export default NotesPage;
