import { NavLink, Route, Routes } from "react-router-dom";
import PwaUpdateBanner from "./components/PwaUpdateBanner";
import HomePage from "./routes/HomePage";
import ReviewPage from "./routes/ReviewPage";
import SearchPage from "./routes/SearchPage";
import SettingsPage from "./routes/SettingsPage";
import StudyPage from "./routes/StudyPage";
import VocabPreviewPage from "./routes/VocabPreviewPage";
import VocabBookPage from "./routes/VocabBookPage";
import WrongBookPage from "./routes/WrongBookPage";

const navItems = [
  { to: "/", label: "首页" },
  { to: "/study", label: "背词" },
  { to: "/review", label: "复习" },
  { to: "/wrong-book", label: "错词" },
  { to: "/search", label: "搜索" },
  { to: "/settings", label: "设置" },
];

function App() {
  return (
    <div className="app-shell">
      <PwaUpdateBanner />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/wrong-book" element={<WrongBookPage />} />
          <Route path="/vocab-book" element={<VocabBookPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/vocab-preview" element={<VocabPreviewPage />} />
        </Routes>
      </main>

      <nav className="bottom-nav" aria-label="主导航">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "bottom-nav__item bottom-nav__item--active" : "bottom-nav__item"
            }
            end={item.to === "/"}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default App;
