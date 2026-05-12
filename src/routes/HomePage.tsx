import { Link } from "react-router-dom";
import HomeActionButton from "../components/HomeActionButton";
import HomeStatCard from "../components/HomeStatCard";
import { APP_VERSION } from "../config/appVersion";
import { vocabWords } from "../data/vocab";
import { readHomeStats } from "../utils/homeStats";
import { loadSettings } from "../utils/settingsStorage";
import { ensureStudyQueue, loadStudyProgress } from "../utils/studyStorage";
import { getStudyWords, SKIP_SIMPLE_WORDS } from "../utils/studyWords";
import { ensureTodayTask, getCurrentTaskMode } from "../utils/todayTaskStorage";
import "./HomePage.css";

function HomePage() {
  const stats = readHomeStats();
  const settings = loadSettings();
  const progress = ensureStudyQueue(loadStudyProgress(), vocabWords, settings);
  const todayTask = ensureTodayTask(progress, settings, vocabWords);
  const studyWords = getStudyWords(vocabWords, {
    studyRange: settings.studyRange,
    skipSimpleWords: SKIP_SIMPLE_WORDS,
  });
  const taskMode = getCurrentTaskMode(todayTask);
  const totalTaskCount = todayTask.newWordIds.length + todayTask.reviewWordIds.length;
  const completedTaskCount = todayTask.completedNewCount + todayTask.completedReviewCount;
  const startDescription =
    taskMode === "review"
      ? "先完成今天到期的复习词"
      : taskMode === "new"
        ? "复习完成后，开始今日新词"
        : "今天的学习任务已经完成";

  return (
    <section className="page home-page">
      <header className="home-hero">
        <p className="home-hero__eyebrow">CET4 / CET6</p>
        <h1 className="home-hero__title">四六级地铁背单词</h1>
        <p className="home-hero__text">上车就能开始，一次背几个也算数。</p>
      </header>

      <div className="home-stats" aria-label="学习统计">
        <HomeStatCard label="总词数" value={studyWords.length} />
        <HomeStatCard label="今日已背" value={stats.todayStudiedCount} />
        <HomeStatCard label="累计认识" value={stats.knownCount} />
        <HomeStatCard label="错词数量" value={stats.wrongCount} />
        <HomeStatCard label="生词本数量" value={stats.vocabBookCount} />
      </div>

      <section className="home-task-panel" aria-label="今日任务">
        <div className="home-task-panel__header">
          <h2 className="home-task-panel__title">今日任务</h2>
          <span className="home-task-panel__badge">
            {taskMode === "review" ? "先复习" : taskMode === "new" ? "学新词" : "已完成"}
          </span>
        </div>

        <div className="home-task-progress">
          <article className="home-task-progress__item">
            <span className="home-task-progress__label">今日新词进度</span>
            <strong className="home-task-progress__value">
              {todayTask.completedNewCount} / {todayTask.newWordIds.length}
            </strong>
          </article>
          <article className="home-task-progress__item">
            <span className="home-task-progress__label">今日复习进度</span>
            <strong className="home-task-progress__value">
              {todayTask.completedReviewCount} / {todayTask.reviewWordIds.length}
            </strong>
          </article>
          <article className="home-task-progress__item home-task-progress__item--wide">
            <span className="home-task-progress__label">今日总进度</span>
            <strong className="home-task-progress__value">
              {completedTaskCount} / {totalTaskCount}
            </strong>
          </article>
        </div>
      </section>

      <div className="home-actions" aria-label="快捷操作">
        <HomeActionButton
          description={startDescription}
          title="开始背单词"
          to="/study"
          variant="primary"
        />
        <HomeActionButton description="看看这段时间学得怎么样" title="学习统计" to="/stats" />
        <HomeActionButton description="整理自己的记忆方法" title="我的笔记" to="/notes" />
        <HomeActionButton description="集中处理不熟的词" title="复习错词" to="/review" />
        <HomeActionButton description="收集想回头看的新词" title="生词本" to="/vocab-book" />
        <HomeActionButton description="快速查找英文单词" title="搜索单词" to="/search" />
        <HomeActionButton description="每日目标和本地数据" title="设置" to="/settings" />
      </div>

      <Link className="home-preview-link" to="/vocab-preview">
        查看词表解析测试
      </Link>

      <footer className="home-version">当前版本 v{APP_VERSION}</footer>
    </section>
  );
}

export default HomePage;
