import { useEffect, useState } from "react";
import { deleteWordNote, getWordNote, saveWordNote } from "../utils/wordNotesStorage";
import "./WordNoteEditor.css";

interface WordNoteEditorProps {
  wordId: number;
  onChanged?: () => void;
}

function WordNoteEditor({ wordId, onChanged }: WordNoteEditorProps) {
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setContent(getWordNote(wordId)?.content ?? "");
    setMessage("");
  }, [wordId]);

  function handleSave() {
    saveWordNote(wordId, content);
    setContent(getWordNote(wordId)?.content ?? "");
    setMessage("笔记已保存");
    onChanged?.();
  }

  function handleDelete() {
    const confirmed = window.confirm("确定要删除这个单词的个人笔记吗？");

    if (!confirmed) {
      return;
    }

    deleteWordNote(wordId);
    setContent("");
    setMessage("笔记已删除");
    onChanged?.();
  }

  return (
    <div className="word-note-editor">
      <textarea
        className="word-note-editor__textarea"
        placeholder="写下你的记忆方法、易混点、例句或老师讲过的重点..."
        value={content}
        onChange={(event) => {
          setContent(event.target.value);
          setMessage("");
        }}
      />

      <div className="word-note-editor__actions">
        <button className="word-note-editor__button" type="button" onClick={handleSave}>
          保存笔记
        </button>
        <button
          className="word-note-editor__button word-note-editor__button--danger"
          type="button"
          onClick={handleDelete}
          disabled={!getWordNote(wordId)}
        >
          删除笔记
        </button>
      </div>

      {message ? <p className="word-note-editor__message">{message}</p> : null}
    </div>
  );
}

export default WordNoteEditor;
