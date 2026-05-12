import { registerSW } from "virtual:pwa-register";
import { APP_VERSION } from "./config/appVersion";

// 只负责注册 service worker。发现新版本时提示用户刷新，避免背单词途中被强制打断。
registerSW({
  onNeedRefresh() {
    const shouldRefresh = window.confirm(`发现新版本，当前版本 ${APP_VERSION}，是否现在刷新？`);

    if (shouldRefresh) {
      window.location.reload();
    }
  },
  onOfflineReady() {
    console.info("离线缓存已准备好：下次断网也可以打开 App。");
  },
});
