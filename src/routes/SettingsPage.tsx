import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { APP_VERSION } from "../config/appVersion";
import {
  clearAllLearningData,
  downloadBackupFile,
  importBackupData,
} from "../utils/backupStorage";
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
import { clearVocabBook } from "../utils/vocabBookStorage";
import { clearAllWordNotes } from "../utils/wordNotesStorage";
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

  function handleExportBackup() {
    downloadBackupFile();
    setMessage("学习数据已导出，请妥善保存备份文件。");
  }

  async function handleImportBackup(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const confirmed = window.confirm("导入备份会覆盖当前学习数据，确定继续吗？");

      if (!confirmed) {
        return;
      }

      importBackupData(parsed);

      const shouldReload = window.confirm("导入成功，请刷新页面。现在立即刷新吗？");

      if (shouldReload) {
        window.location.reload();
        return;
      }

      setMessage("导入成功，请刷新页面。");
    } catch {
      setMessage("导入失败：请选择当前 App 导出的有效 JSON 备份文件。");
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleClearAllLearningData() {
    const confirmed = window.confirm(
      "确定要清空全部学习数据吗？这会删除学习记录、今日任务、生词本、错词统计和设置。建议先导出备份。",
    );

    if (!confirmed) {
      return;
    }

    const confirmedAgain = window.confirm("请再次确认：清空后将恢复为首次使用状态。");

    if (!confirmedAgain) {
      return;
    }

    clearAllLearningData();
    window.location.reload();
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

  function handleClearWordNotes() {
    const confirmed = window.confirm(
      "确定要清空所有个人笔记吗？这个操作不会删除学习记录，但会删除你给单词写的所有笔记。",
    );

    if (!confirmed) {
      return;
    }

    const confirmedAgain = window.confirm("请再次确认：清空后所有个人笔记都会被删除。");

    if (!confirmedAgain) {
      return;
    }

    clearAllWordNotes();
    setMessage("所有个人笔记已清空。");
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
        <Link className="settings-link" to="/stats">
          查看学习统计
        </Link>
        <Link className="settings-link" to="/notes">
          查看我的笔记
        </Link>
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
        <h2 className="settings-section__title">数据备份</h2>
        <p className="settings-section__text">
          学习数据只保存在当前浏览器本地。建议定期导出 JSON 备份，换手机时可以直接导入恢复。
        </p>
        <div className="settings-data-actions">
          <button className="settings-action" type="button" onClick={handleExportBackup}>
            导出学习数据
          </button>
          <button
            className="settings-action"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            导入学习数据
          </button>
          <button
            className="settings-action settings-action--danger"
            type="button"
            onClick={handleClearAllLearningData}
          >
            清空全部学习数据
          </button>
          <input
            accept="application/json,.json"
            className="settings-file-input"
            ref={fileInputRef}
            type="file"
            onChange={(event) => void handleImportBackup(event.target.files?.[0])}
          />
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-section__title">数据管理</h2>
        <p className="settings-section__text">如果只是想整理生词本或个人笔记，可以单独清空，不影响学习记录。</p>
        <div className="settings-data-actions">
          <button className="settings-action settings-action--danger" type="button" onClick={handleClearVocabBook}>
            清空生词本
          </button>
          <button className="settings-action settings-action--danger" type="button" onClick={handleClearWordNotes}>
            清空所有个人笔记
          </button>
        </div>
      </section>
    </section>
  );
}

export default SettingsPage;
