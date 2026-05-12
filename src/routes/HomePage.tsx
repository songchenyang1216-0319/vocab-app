import { Link } from "react-router-dom";
import HomeActionButton from "../components/HomeActionButton";
import HomeStatCard from "../components/HomeStatCard";
import { APP_VERSION } from "../config/appVersion";
import vocabMarkdown from "../data/CET4_CET6_5500_words_CN.md?raw";
import { readHomeStats } from "../utils/homeStats";
import { parseVocabMarkdown } from "../utils/parseVocabMarkdown";
import { loadSettings } from "../utils/settingsStorage";
import { getStudyWords, SKIP_SIMPLE_WORDS } from "../utils/studyWords";
import "./HomePage.css";

const vocabWords = parseVocabMarkdown(vocabMarkdown);

function HomePage() {
  const stats = readHomeStats();
  const settings = loadSettings();
  const studyWords = getStudyWords(vocabWords, {
    studyRange: settings.studyRange,
    skipSimpleWords: SKIP_SIMPLE_WORDS,
  });

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
      </div>

      <div className="home-actions" aria-label="快捷操作">
        <HomeActionButton
          description="继续从当前进度开始"
          title="开始背单词"
          to="/study"
          variant="primary"
        />
        <HomeActionButton description="集中处理不熟的词" title="复习错词" to="/review" />
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
