import { useEffect, useState } from "react";
import { applyPwaUpdate, subscribePwaUpdate } from "../pwa";

function PwaUpdateBanner() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => subscribePwaUpdate(setHasUpdate), []);

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      await applyPwaUpdate();
    } catch {
      setIsRefreshing(false);
    }
  }

  if (!hasUpdate) {
    return null;
  }

  return (
    <div className="pwa-update-banner" role="status" aria-live="polite">
      <button
        className="pwa-update-banner__button"
        type="button"
        onClick={() => void handleRefresh()}
        disabled={isRefreshing}
      >
        {isRefreshing ? "正在刷新新版本..." : "发现新版本，点击刷新"}
      </button>
    </div>
  );
}

export default PwaUpdateBanner;
