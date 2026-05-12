import { useState } from "react";
import { Link } from "react-router-dom";
import WordNoteEditor from "../components/WordNoteEditor";
import { vocabWords, wordMap } from "../data/vocab";
import type { StudyStatus } from "../utils/studyStorage";
import {
  ensureStudyQueue,
  loadStudyProgress,
  markCurrentWordWithoutMoving,
  markReviewWord,
  moveToNextStudyWord,
} from "../utils/studyStorage";
import { loadSettings } from "../utils/settingsStorage";
import {
  appendMoreNewWords,
  completeTodayNewWord,
  completeTodayReview,
  ensureTodayTask,
  getCurrentTaskMode,
  getStudyPoolCount,
  regenerateTodayTask,
  type TodayTask,
} from "../utils/todayTaskStorage";
import { addToVocabBook, isInVocabBook } from "../utils/vocabBookStorage";
import { hasWordNote } from "../utils/wordNotesStorage";
import "./StudyPage.css";

const actionButtons: Array<{ label: string; status: StudyStatus; className: string }> = [
  { label: "认识", status: "known", className: "study-action-button--known" },
  { label: "模糊", status: "vague", className: "study-action-button--vague" },
  { label: "不认识", status: "unknown", className: "study-action-button--unknown" },
];

type AnswerPhase = "idle" | "knownReveal" | "vagueConfirm" | "unknownConfirm";
type TaskMode = "review" | "new" | "done";

function StudyPage() {
  const settings = loadSettings();
  const initialProgress = ensureStudyQueue(loadStudyProgress(), vocabWords, settings);
  const [progress, setProgress] = useState(() => initialProgress);
  const [todayTask, setTodayTask] = useState(() =>
    ensureTodayTask(initialProgress, settings, vocabWords),
  );
  const [showMeaning, setShowMeaning] = useState(false);
  const [showNoteEditor, setShowNoteEditor] = useState(false);
  const [, setNoteVersion] = useState(0);
  const [answerPhase, setAnswerPhase] = useState<AnswerPhase>("idle");
  const studyQueueIds = progress.studyQueueIds ?? [];
  const taskMode: TaskMode = getCurrentTaskMode(todayTask);
  const studyPoolCount = getStudyPoolCount(vocabWords, settings);
  const currentWordId =
    taskMode === "review"
      ? todayTask.reviewWordIds[todayTask.completedReviewCount]
      : taskMode === "new"
        ? todayTask.newWordIds[todayTask.completedNewCount]
        : undefined;
  const currentWord = currentWordId === undefined ? undefined : wordMap.get(currentWordId);
  const totalTaskCount = todayTask.reviewWordIds.length + todayTask.newWordIds.length;
  const completedTaskCount = todayTask.completedReviewCount + todayTask.completedNewCount;
  const currentDisplayIndex = currentWord ? Math.min(completedTaskCount + 1, Math.max(totalTaskCount, 1)) : totalTaskCount;
  const currentWordInVocabBook = currentWord ? isInVocabBook(currentWord.id) : false;
  const currentWordHasNote = currentWord ? hasWordNote(currentWord.id) : false;
  const reviewActions: Array<{ label: string; status: StudyStatus; className: string }> = [
    { label: "记住了", status: "known", className: "study-action-button--known" },
    { label: "还模糊", status: "vague", className: "study-action-button--vague" },
    { label: "没记住", status: "unknown", className: "study-action-button--unknown" },
  ];

  function resetAnswerUi() {
    setShowMeaning(false);
    setShowNoteEditor(false);
    setAnswerPhase("idle");
  }

  function moveToNextWord(baseProgress: typeof progress, baseTask: TodayTask, mode: "new" | "review") {
    const nextProgress = moveToNextStudyWord(baseProgress, studyQueueIds.length);
    const nextTask = mode === "new" ? completeTodayNewWord(baseTask) : completeTodayReview(baseTask);

    setProgress(nextProgress);
    setTodayTask(nextTask);
    resetAnswerUi();
  }

  function moveToNextReview(baseProgress: typeof progress, baseTask: TodayTask) {
    const nextTask = completeTodayReview(baseTask);

    setProgress(baseProgress);
    setTodayTask(nextTask);
    resetAnswerUi();
  }

  function handleContinueNewWords() {
    const nextTask = appendMoreNewWords(todayTask, progress, settings, vocabWords);

    setTodayTask(nextTask);
    resetAnswerUi();
  }

  function handleRegenerateTodayTask() {
    const nextProgress = ensureStudyQueue(loadStudyProgress(), vocabWords, settings);
    const nextTask = regenerateTodayTask(nextProgress, settings, vocabWords);

    setProgress(nextProgress);
    setTodayTask(nextTask);
    resetAnswerUi();
  }

  function handleMarkWord(status: StudyStatus) {
    if (!currentWord || answerPhase !== "idle") {
      return;
    }

    if (taskMode === "review") {
      const nextProgress = markReviewWord(progress, currentWord.id, status);
      moveToNextReview(nextProgress, todayTask);
      return;
    }

    if (status === "known") {
      setShowMeaning(true);
      setAnswerPhase("knownReveal");
      return;
    }

    if (status === "vague") {
      setShowMeaning(true);
      setAnswerPhase("vagueConfirm");
      return;
    }

    const nextProgress = markCurrentWordWithoutMoving(progress, currentWord.id, status);

    setProgress(nextProgress);
    setShowMeaning(true);
    setAnswerPhase("unknownConfirm");
  }

  function handleVagueDecision(status: "vague" | "unknown") {
    if (!currentWord || answerPhase !== "vagueConfirm" || taskMode !== "new") {
      return;
    }

    const nextProgress = markCurrentWordWithoutMoving(progress, currentWord.id, status);
    moveToNextWord(nextProgress, todayTask, "new");
  }

  function handleKnownDecision(status: "known" | "vague") {
    if (!currentWord || answerPhase !== "knownReveal" || taskMode !== "new") {
      return;
    }

    const nextProgress = markCurrentWordWithoutMoving(progress, currentWord.id, status);
    moveToNextWord(nextProgress, todayTask, "new");
  }

  function handleUnknownDecision(shouldAddToVocabBook: boolean) {
    if (!currentWord || answerPhase !== "unknownConfirm" || taskMode !== "new") {
      return;
    }

    if (shouldAddToVocabBook) {
      addToVocabBook(currentWord.id);
    }

    moveToNextWord(progress, todayTask, "new");
  }

  if (studyPoolCount === 0) {
    return (
      <section className="page study-page">
        <header className="study-topbar">
          <div className="study-topbar__left">
            <Link className="study-back-link" aria-label="返回首页" to="/">
              ‹
            </Link>
            <span className="study-progress">0/0</span>
          </div>
        </header>

        <div className="study-complete">
          <h1>当前范围没有可用单词</h1>
          <p>当前背诵范围没有可用单词，请去设置页调整背诵范围。</p>
          <Link className="study-restart-button" to="/settings">
            去设置页
          </Link>
          <Link className="primary-link" to="/">
            返回首页
          </Link>
        </div>
      </section>
    );
  }

  if (taskMode === "done" || !currentWord) {
    return (
      <section className="page study-page">
        <header className="study-topbar">
          <div className="study-topbar__left">
            <Link className="study-back-link" aria-label="返回首页" to="/">
              ‹
            </Link>
            <span className="study-progress">{totalTaskCount}/{totalTaskCount}</span>
          </div>
        </header>

        <div className="study-complete">
          <h1>今日任务已完成</h1>
          <p>今天的复习和新词都已经处理完了。你也可以继续背一批新词，或者重新生成今天的任务。</p>
          <button className="study-restart-button" type="button" onClick={handleContinueNewWords}>
            继续背新词
          </button>
          <button className="study-secondary-button" type="button" onClick={handleRegenerateTodayTask}>
            重新生成今日任务
          </button>
          <Link className="primary-link" to="/review">
            去复习页
          </Link>
          <Link className="secondary-link" to="/">
            返回首页
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
            {currentDisplayIndex}/{totalTaskCount}
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
          <div className="study-task-summary">
            <span className="study-task-summary__badge">
              {taskMode === "review" ? "今日复习" : "今日新词"}
            </span>
            <p className="study-task-summary__text">
              新词 {todayTask.completedNewCount}/{todayTask.newWordIds.length} · 复习{" "}
              {todayTask.completedReviewCount}/{todayTask.reviewWordIds.length}
            </p>
          </div>
          <h1 className="study-card__word">{currentWord.word}</h1>
          <div className="study-meta-row">
            <span className="study-card__tag">{currentWord.tag}</span>
            <button
              className={currentWordHasNote ? "study-note-toggle study-note-toggle--active" : "study-note-toggle"}
              type="button"
              onClick={() => setShowNoteEditor((value) => !value)}
            >
              {currentWordHasNote ? "有笔记" : "笔记"}
            </button>
          </div>
        </div>

        {showNoteEditor ? (
          <div className="study-note-panel">
            <WordNoteEditor
              wordId={currentWord.id}
              onChanged={() => setNoteVersion((version) => version + 1)}
            />
          </div>
        ) : null}

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
          {answerPhase === "idle" && taskMode === "new" ? (
            <div className="study-hint">
              <p>瞬间想起词义，选「认识」</p>
              <p>思考后想起词义，选「模糊」</p>
            </div>
          ) : null}

          {answerPhase === "idle" && taskMode === "review" ? (
            <div className="study-hint">
              <p>先回忆，再看释义</p>
              <p>到期复习词会优先完成</p>
            </div>
          ) : null}

          {answerPhase === "idle" ? (
            <div className="study-actions" aria-label="学习反馈">
              {(taskMode === "review" ? reviewActions : actionButtons).map((item) => (
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
          ) : null}

          {answerPhase === "knownReveal" ? (
            <div className="study-follow-up study-follow-up--neutral" aria-label="认识后的二次确认">
              <p className="study-follow-up__text">看一眼释义，再确认自己是真的认识，还是刚才记错了。</p>
              <div className="study-follow-up__actions">
                <button
                  className="study-follow-up-button study-follow-up-button--mistake"
                  type="button"
                  onClick={() => handleKnownDecision("vague")}
                >
                  记错了
                </button>
                <button
                  className="study-follow-up-button study-follow-up-button--known-next"
                  type="button"
                  onClick={() => handleKnownDecision("known")}
                >
                  下一个
                </button>
              </div>
            </div>
          ) : null}

          {answerPhase === "vagueConfirm" ? (
            <div className="study-follow-up" aria-label="模糊后的二次判断">
              <p className="study-follow-up__text">看过释义后，再判断一次更接近哪种情况。</p>
              <div className="study-follow-up__actions">
                <button
                  className="study-follow-up-button study-follow-up-button--unknown"
                  type="button"
                  onClick={() => handleVagueDecision("unknown")}
                >
                  不认识
                </button>
                <button
                  className="study-follow-up-button study-follow-up-button--vague"
                  type="button"
                  onClick={() => handleVagueDecision("vague")}
                >
                  有印象
                </button>
              </div>
            </div>
          ) : null}

          {answerPhase === "unknownConfirm" ? (
            <div className="study-follow-up" aria-label="不认识后的后续操作">
              <p className="study-follow-up__text">
                {currentWordInVocabBook
                  ? "这个单词已经在生词本里了，可以直接进入下一个。"
                  : "可以把这个单词收进生词本，后面集中回看。"}
              </p>
              <div className="study-follow-up__actions">
                <button
                  className="study-follow-up-button study-follow-up-button--book"
                  type="button"
                  onClick={() => handleUnknownDecision(true)}
                >
                  {currentWordInVocabBook ? "已在生词本，继续" : "加入生词本"}
                </button>
                <button
                  className="study-follow-up-button study-follow-up-button--next"
                  type="button"
                  onClick={() => handleUnknownDecision(false)}
                >
                  下一个
                </button>
              </div>
            </div>
          ) : null}
        </footer>
      </article>
    </section>
  );
}

export default StudyPage;
