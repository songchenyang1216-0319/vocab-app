import { Link } from "react-router-dom";
import { getStudyStats } from "../utils/studyStats";
import "./StatsPage.css";

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function StatsPage() {
  const stats = getStudyStats();

  return (
    <section className="page stats-page">
      <header className="stats-header">
        <p className="stats-header__eyebrow">Stats</p>
        <h1 className="stats-header__title">学习统计</h1>
      </header>

      <section className="stats-section">
        <div className="stats-section__header">
          <h2 className="stats-section__title">今日学习</h2>
        </div>

        <div className="stats-grid">
          <article className="stats-card">
            <span className="stats-card__label">今日新词完成</span>
            <strong className="stats-card__value">
              {stats.todayNewCompleted} / {stats.todayNewTotal}
            </strong>
          </article>
          <article className="stats-card">
            <span className="stats-card__label">今日复习完成</span>
            <strong className="stats-card__value">
              {stats.todayReviewCompleted} / {stats.todayReviewTotal}
            </strong>
          </article>
          <article className="stats-card stats-card--wide">
            <span className="stats-card__label">今日总进度</span>
            <strong className="stats-card__value">
              {stats.todayTotalCompleted} / {stats.todayTotal}
            </strong>
          </article>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-section__header">
          <h2 className="stats-section__title">累计数据</h2>
        </div>

        <div className="stats-grid">
          <article className="stats-card">
            <span className="stats-card__label">累计学习词数</span>
            <strong className="stats-card__value">{stats.learnedCount}</strong>
          </article>
          <article className="stats-card">
            <span className="stats-card__label">累计认识数量</span>
            <strong className="stats-card__value">{stats.knownCount}</strong>
          </article>
          <article className="stats-card">
            <span className="stats-card__label">有印象 / 模糊</span>
            <strong className="stats-card__value">{stats.vagueCount}</strong>
          </article>
          <article className="stats-card">
            <span className="stats-card__label">不认识数量</span>
            <strong className="stats-card__value">{stats.unknownCount}</strong>
          </article>
          <article className="stats-card">
            <span className="stats-card__label">错词数量</span>
            <strong className="stats-card__value">{stats.wrongCount}</strong>
          </article>
          <article className="stats-card">
            <span className="stats-card__label">生词本数量</span>
            <strong className="stats-card__value">{stats.vocabBookCount}</strong>
          </article>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-section__header">
          <h2 className="stats-section__title">掌握情况</h2>
        </div>

        <div className="stats-grid">
          <article className="stats-card">
            <span className="stats-card__label">掌握率</span>
            <strong className="stats-card__value">{formatPercent(stats.masteryRate)}</strong>
          </article>
          <article className="stats-card">
            <span className="stats-card__label">待复习数量</span>
            <strong className="stats-card__value">{stats.dueReviewCount}</strong>
          </article>
          <article className="stats-card stats-card--wide">
            <span className="stats-card__label">连续打卡天数</span>
            <strong className="stats-card__value">{stats.streakDays > 0 ? `${stats.streakDays} 天` : "开发中"}</strong>
          </article>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-section__header">
          <h2 className="stats-section__title">最近 7 天</h2>
        </div>

        {stats.recentSevenDays.length === 0 ? (
          <div className="stats-empty">暂无最近 7 天学习数据</div>
        ) : (
          <ol className="stats-trend-list">
            {stats.recentSevenDays.map((item) => (
              <li className="stats-trend-item" key={item.date}>
                <span className="stats-trend-item__date">{item.date}</span>
                <span className="stats-trend-item__value">完成 {item.completedCount} 个</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <Link className="secondary-link" to="/">
        返回首页
      </Link>
    </section>
  );
}

export default StatsPage;
