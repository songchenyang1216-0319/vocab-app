import { registerSW } from "virtual:pwa-register";

type PwaUpdateListener = (hasUpdate: boolean) => void;

const updateListeners = new Set<PwaUpdateListener>();
let hasPendingUpdate = false;

function notifyUpdateListeners() {
  updateListeners.forEach((listener) => listener(hasPendingUpdate));
}

// 保持一个全局的更新入口，页面里的提示条点击后可以安全激活新版本。
const updateServiceWorker = registerSW({
  onNeedRefresh() {
    hasPendingUpdate = true;
    notifyUpdateListeners();
  },
  onOfflineReady() {
    console.info("离线缓存已准备好：下次断网也可以打开 App。");
  },
});

export function subscribePwaUpdate(listener: PwaUpdateListener) {
  updateListeners.add(listener);
  listener(hasPendingUpdate);

  return () => {
    updateListeners.delete(listener);
  };
}

export async function applyPwaUpdate() {
  hasPendingUpdate = false;
  notifyUpdateListeners();
  await updateServiceWorker(true);
}
