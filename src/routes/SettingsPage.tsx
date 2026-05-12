import { useRef, useState } from "react";
import { APP_VERSION } from "../config/appVersion";
import {
  clearStudyProgress,
  exportStudyProgressJson,
  importStudyProgressJson,
} from "../utils/studyStorage";
import {
  loadSettings,
  saveSettings,
  type AppSettings,
  type DailyGoal,
  type DailyNewWordCount,
  type DailyReviewLimit,
  type StudyOrder,
  type StudyRange,
} from "../utils/settingsStorage";
import { clearTodayTask } from "../utils/todayTaskStorage";
import { clearVocabBook } from "../utils/vocabBookStorage";
import "./SettingsPage.css";

const dailyGoals: DailyGoal[] = [50, 100, 150, 200];
const dailyNewWordCounts: DailyNewWordCount[] = [20, 30, 50, 100];
const dailyReviewLimits: DailyReviewLimit[] = [30, 50, 100, "不限制"];
const studyRanges: StudyRange[] = ["全部", "四/六", "六级", "四级补充"];
const studyOrders: Array<{ label: string; value: StudyOrder }> = [
  { label: "按 A-Z 顺序", value: "az" },
  { label: "随机顺序", value: "random" },
  { label: "优先背不认识的", value: "unknown-first" },
];

function SettingsPage() {
  const [settings, setSettings] = useState(() => loadSettings());
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateSettings(nextSettings: AppSettings, successMessage: string) {
    setSettings(nextSettings);
    saveSettings(nextSettings);
    setMessage(successMessage);
  }

  function handleClearProgress() {
    const confirmed = window.confirm("确定要清空所有学习记录吗？这个操作不能撤销。");

    if (!confirmed) {
      return;
    }

    const confirmedAgain = window.confirm("请再次确认：清空后今日进度、错词和复习记录都会归零。");

    if (!confirmedAgain) {
      return;
    }

    clearStudyProgress();
    clearTodayTask();
    setMessage("学习记录已清空。");
  }

  function handleExportProgress() {
    const jsonText = exportStudyProgressJson();
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `cet-vocab-progress-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("学习记录 JSON 已导出。");
  }

  function handleClearVocabBook() {
    const confirmed = window.confirm(
      "确定要清空生词本吗？这个操作不会删除学习记录，但会移除所有生词本单词。",
    );

    if (!confirmed) {
      return;
    }

    const confirmedAgain = window.confirm("请再次确认：清空后生词本里的单词将全部移除。");

    if (!confirmedAgain) {
      return;
    }

    clearVocabBook();
    setMessage("生词本已清空。");
  }

  async function handleImportProgress(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const jsonText = await file.text();
      importStudyProgressJson(jsonText);
      clearTodayTask();
      setMessage("学习记录已导入。");
    } catch {
      setMessage("导入失败：请选择有效的学习记录 JSON 文件。");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <section className="page settings-page">
      <header className="settings-header">
        <p className="settings-header__eyebrow">Settings</p>
        <h1 className="settings-header__title">设置</h1>
      </header>

      {message ? <p className="settings-message">{message}</p> : null}

      <section className="settings-section">
        <h2 className="settings-section__title">应用信息</h2>
        <p className="settings-section__text">当前版本：v{APP_VERSION}</p>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">复习间隔说明</h2>
        <p className="settings-section__text">
          不认识：30 分钟后；有印象或记错了：明天；认识 1 次：3 天后；连续认识 2 次：7
          天后；连续认识 3 次：15 天后；连续认识 4 次及以上：30 天后。
        </p>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">每日目标</h2>
        <div className="settings-options">
          {dailyGoals.map((goal) => (
            <button
              className={
                settings.dailyGoal === goal
                  ? "settings-option settings-option--active"
                  : "settings-option"
              }
              key={goal}
              type="button"
              onClick={() =>
                updateSettings({ ...settings, dailyGoal: goal }, `每日目标已设置为 ${goal} 个。`)
              }
            >
              {goal} 个
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">每日新词数量</h2>
        <div className="settings-options">
          {dailyNewWordCounts.map((count) => (
            <button
              className={
                settings.dailyNewWordCount === count
                  ? "settings-option settings-option--active"
                  : "settings-option"
              }
              key={count}
              type="button"
              onClick={() =>
                updateSettings(
                  { ...settings, dailyNewWordCount: count },
                  `每日新词数量已设置为 ${count} 个。`,
                )
              }
            >
              {count} 个
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">每日复习上限</h2>
        <div className="settings-options">
          {dailyReviewLimits.map((limit) => (
            <button
              className={
                settings.dailyReviewLimit === limit
                  ? "settings-option settings-option--active"
                  : "settings-option"
              }
              key={String(limit)}
              type="button"
              onClick={() =>
                updateSettings(
                  { ...settings, dailyReviewLimit: limit },
                  `每日复习上限已设置为 ${limit}。`,
                )
              }
            >
              {limit === "不限制" ? limit : `${limit} 个`}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">背诵范围</h2>
        <div className="settings-options">
          {studyRanges.map((range) => (
            <button
              className={
                settings.studyRange === range
                  ? "settings-option settings-option--active"
                  : "settings-option"
              }
              key={range}
              type="button"
              onClick={() =>
                updateSettings({ ...settings, studyRange: range }, `背诵范围已设置为 ${range}。`)
              }
            >
              {range}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">背诵顺序</h2>
        <div className="settings-options">
          {studyOrders.map((order) => (
            <button
              className={
                settings.studyOrder === order.value
                  ? "settings-option settings-option--active"
                  : "settings-option"
              }
              key={order.value}
              type="button"
              onClick={() =>
                updateSettings(
                  { ...settings, studyOrder: order.value },
                  `背诵顺序已设置为 ${order.label}。`,
                )
              }
            >
              {order.label}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">数据管理</h2>
        <p className="settings-section__text">学习记录只保存在当前浏览器本地。</p>
        <div className="settings-data-actions">
          <button className="settings-action settings-action--danger" type="button" onClick={handleClearProgress}>
            清空学习记录
          </button>
          <button className="settings-action settings-action--danger" type="button" onClick={handleClearVocabBook}>
            清空生词本
          </button>
          <button className="settings-action" type="button" onClick={handleExportProgress}>
            导出学习记录 JSON
          </button>
          <button
            className="settings-action"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            导入学习记录 JSON
          </button>
          <input
            accept="application/json,.json"
            className="settings-file-input"
            ref={fileInputRef}
            type="file"
            onChange={(event) => void handleImportProgress(event.target.files?.[0])}
          />
        </div>
      </section>
    </section>
  );
}

export default SettingsPage;
