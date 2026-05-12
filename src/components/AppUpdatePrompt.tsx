import { useEffect, useState } from "react";
import { APP_VERSION } from "../config/appVersion";
import { applyPwaUpdate, subscribePwaUpdate } from "../pwa";

function AppUpdatePrompt() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    return subscribePwaUpdate((nextHasUpdate) => {
      setHasUpdate(nextHasUpdate);

      if (nextHasUpdate) {
        setIsDismissed(false);
      }
    });
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      await applyPwaUpdate();
    } catch {
      setIsRefreshing(false);
    }
  }

  if (!hasUpdate || isDismissed) {
    return null;
  }

  return (
    <div className="app-update-prompt" role="status" aria-live="polite">
      <div className="app-update-prompt__content">
        <p className="app-update-prompt__text">发现新版本，点击刷新</p>
        <p className="app-update-prompt__version">当前版本 v{APP_VERSION}</p>
      </div>

      <div className="app-update-prompt__actions">
        <button
          className="app-update-prompt__button app-update-prompt__button--secondary"
          type="button"
          onClick={() => setIsDismissed(true)}
          disabled={isRefreshing}
        >
          稍后
        </button>
        <button
          className="app-update-prompt__button app-update-prompt__button--primary"
          type="button"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
        >
          {isRefreshing ? "刷新中..." : "刷新"}
        </button>
      </div>
    </div>
  );
}

export default AppUpdatePrompt;
