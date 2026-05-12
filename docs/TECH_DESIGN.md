# 四六级地铁背单词 App 技术设计文档

## 1. 技术选型

本项目第一版建议使用：

- React
- TypeScript
- Vite
- PWA
- localStorage
- 无后端
- 无登录

### 1.1 为什么选择 React

React 适合把界面拆成多个小组件。这个 App 的核心界面比较清晰，例如首页、单词卡片、底部导航、进度条、操作按钮，都可以做成独立组件。

后续如果要扩展搜索、错词本、复习计划，也可以继续复用已有组件。

### 1.2 为什么选择 TypeScript

这个项目会处理单词数据和学习记录。TypeScript 可以提前定义数据结构，减少字段写错导致的问题。

例如 `status` 只能是：

```ts
type ReviewStatus = "known" | "vague" | "unknown";
```

这样写以后，如果代码里误写成 `"unkown"`，TypeScript 会提醒。

### 1.3 为什么选择 Vite

Vite 启动快，配置简单，适合新手从零搭建前端项目。

本项目使用 Vite 的好处：

- 快速创建 React + TypeScript 项目。
- 开发时热更新快。
- 构建静态文件简单。
- 可以配合 `vite-plugin-pwa` 做离线缓存。

### 1.4 为什么选择 PWA

PWA 可以让网页更像手机 App：

- 可以添加到手机桌面。
- 可以缓存页面和数据文件。
- 离线时仍然可以打开。

这个项目面向地铁场景，网络可能不稳定，所以 PWA 是核心能力。

### 1.5 为什么第一版不需要后端

第一版只需要完成“背单词、记录状态、下次继续”。

这些数据可以全部保存在浏览器本地：

- 单词数据来自本地 JSON 文件。
- 学习记录保存在 `localStorage`。
- 不做账号和云同步。

这样开发难度更低，部署也更简单。项目构建后就是一组静态文件，可以部署到任意静态网站服务。

## 2. 项目目录结构

建议目录结构如下：

```text
vocab-app/
  CET4_CET6_5500_words_CN.md
  docs/
    PRD.md
    TECH_DESIGN.md
  public/
    icons/
      icon-192.png
      icon-512.png
    manifest.webmanifest
  scripts/
    parseWords.ts
  src/
    App.tsx
    main.tsx
    index.css
    data/
      words.json
    types/
      word.ts
      progress.ts
    utils/
      date.ts
      storage.ts
      wordParser.ts
      review.ts
    routes/
      HomePage.tsx
      StudyPage.tsx
      ReviewPage.tsx
      WrongBookPage.tsx
      SearchPage.tsx
      SettingsPage.tsx
    components/
      BottomNav.tsx
      WordCard.tsx
      ProgressBar.tsx
      StatItem.tsx
      EmptyState.tsx
    hooks/
      useProgress.ts
      useWords.ts
  package.json
  vite.config.ts
  tsconfig.json
```

目录说明：

- `docs/`：放产品文档和技术文档。
- `public/`：放 PWA 图标、manifest 等不会被代码 import 的静态文件。
- `scripts/`：放开发期脚本，例如把 Markdown 词表转换成 JSON。
- `src/data/words.json`：转换后的单词数据，App 运行时直接读取它。
- `src/types/`：放 TypeScript 类型定义。
- `src/utils/`：放工具函数，例如本地存储、日期处理、复习时间计算。
- `src/routes/`：放页面级组件。
- `src/components/`：放可复用 UI 组件。
- `src/hooks/`：放 React hooks，例如读取和保存学习进度。

## 3. Markdown 词表解析方案

原始词表文件是：

```text
CET4_CET6_5500_words_CN.md
```

文件前面有标题和说明，不是每一行都是单词。解析时只处理符合词条格式的行。

真实词条示例：

```text
0001. **a** — art. 一（个）；每一（个） `[四级补充]`
0002. **abandon** — vt. 离弃，丢弃；遗弃，抛弃；放弃 n. 放任； 纵情 `[四/六]`
0003. **abandonment** — n. 放弃 `[六级]`
```

### 3.1 推荐解析流程

开发期运行脚本：

```text
scripts/parseWords.ts
```

脚本读取 Markdown，生成：

```text
src/data/words.json
```

App 运行时不要再解析 Markdown，而是直接 import JSON。

这样做的好处：

- App 启动更快。
- 解析错误可以在开发阶段发现。
- JSON 更适合前端直接使用。

### 3.2 解析正则

建议先用一个主正则提取编号、单词、释义和标签：

```ts
const linePattern = /^(\d{4})\.\s+\*\*(.+?)\*\*\s+—\s+(.+?)\s+`\[(.+?)\]`$/;
```

字段含义：

- `(\d{4})`：编号，例如 `0002`。
- `(.+?)`：单词，例如 `abandon`。
- `(.+?)`：释义部分，例如 `vt. 离弃，丢弃；遗弃，抛弃；放弃 n. 放任； 纵情`。
- `(.+?)`：标签，例如 `四/六`、`六级`、`四级补充`。

### 3.3 meaning 处理

第一版可以把词性和中文释义都放在 `meaning` 字段里，不强行拆分。

例如：

```text
vt. 离弃，丢弃；遗弃，抛弃；放弃 n. 放任； 纵情
```

保存为：

```ts
meaning: "vt. 离弃，丢弃；遗弃，抛弃；放弃 n. 放任； 纵情"
```

这样实现简单，也不会因为词性复杂导致解析错误。

### 3.4 alphabet 处理

`alphabet` 表示单词首字母，用来做搜索分组或索引。

规则：

```ts
const alphabet = word[0].toUpperCase();
```

例如：

- `abandon` 的 `alphabet` 是 `"A"`。
- `zoo` 的 `alphabet` 是 `"Z"`。

### 3.5 解析脚本伪代码

```ts
import fs from "node:fs";
import path from "node:path";

const inputPath = path.resolve("CET4_CET6_5500_words_CN.md");
const outputPath = path.resolve("src/data/words.json");
const markdown = fs.readFileSync(inputPath, "utf-8");

const linePattern = /^(\d{4})\.\s+\*\*(.+?)\*\*\s+—\s+(.+?)\s+`\[(.+?)\]`$/;

const words = markdown
  .split(/\r?\n/)
  .map((line) => line.trim())
  .map((line) => {
    const match = line.match(linePattern);
    if (!match) return null;

    const [, idText, word, meaning, tag] = match;

    return {
      id: Number(idText),
      word,
      meaning: meaning.trim(),
      tag,
      alphabet: word[0].toUpperCase(),
    };
  })
  .filter(Boolean);

fs.writeFileSync(outputPath, JSON.stringify(words, null, 2), "utf-8");
```

### 3.6 解析结果校验

脚本生成 JSON 后，需要检查：

- 单词数量是否接近 5500。
- 每个 `id` 是否唯一。
- 每个 `word` 是否非空。
- 每个 `meaning` 是否非空。
- 每个 `tag` 是否在允许范围内。

第一版允许的标签：

```ts
type WordTag = "四/六" | "六级" | "四级补充";
```

如果发现其他标签，脚本应该打印出来，方便人工检查。

## 4. 单词数据结构

第一版推荐结构：

```ts
type WordTag = "四/六" | "六级" | "四级补充";

type Word = {
  id: number;
  word: string;
  meaning: string;
  tag: WordTag;
  alphabet: string;
};
```

示例：

```json
{
  "id": 2,
  "word": "abandon",
  "meaning": "vt. 离弃，丢弃；遗弃，抛弃；放弃 n. 放任； 纵情",
  "tag": "四/六",
  "alphabet": "A"
}
```

字段说明：

- `id`：单词编号，来自 Markdown 行首编号。
- `word`：英文单词。
- `meaning`：中文释义，包含词性。
- `tag`：词表标签，用于区分四级、六级或补充词。
- `alphabet`：首字母大写，用于搜索页分组。

注意：PRD 中提到过更细的 `partOfSpeech` 和 `definitionCn`。技术实现第一版建议先用一个 `meaning` 字段承接完整释义，降低解析难度。后续如果需要更细展示，再升级数据结构。

### 4.1 简单词过滤规则

简单词过滤不应该放在 Markdown 解析阶段。

原因：

- 解析函数的职责是完整还原词库。
- 搜索页需要完整词库。
- 错词本需要能根据旧学习记录找到原始单词。
- 如果解析阶段直接删词，旧记录中的 `wordId` 可能找不到对应单词。

因此建议新增学习词表工具函数，例如：

```text
src/utils/studyWords.ts
```

第一版过滤规则：

```ts
function shouldSkipSimpleWord(word: Word): boolean {
  return word.word.trim().length <= 1;
}
```

背单词页使用过滤后的词表，搜索页和错词本继续使用完整词表。

## 5. 学习记录数据结构

单个单词的学习记录：

```ts
type StudyStatus = "known" | "vague" | "unknown";

type WordStudyRecord = {
  wordId: number;
  status: StudyStatus;
  reviewCount: number;
  wrongCount: number;
  lastReviewAt: string;
  nextReviewAt: string;
};
```

示例：

```json
{
  "wordId": 2,
  "status": "unknown",
  "reviewCount": 3,
  "wrongCount": 2,
  "lastReviewAt": "2026-05-12T12:30:00.000Z",
  "nextReviewAt": "2026-05-13T12:30:00.000Z"
}
```

字段说明：

- `wordId`：对应 `Word.id`。
- `status`：当前掌握状态。
- `reviewCount`：复习次数。
- `wrongCount`：标记为不认识的次数。
- `lastReviewAt`：最近一次学习或复习时间，使用 ISO 字符串。
- `nextReviewAt`：下次建议复习时间，使用 ISO 字符串。

### 5.1 status 规则

第一版三个状态：

- `known`：认识，暂时不进入重点复习。
- `vague`：模糊，对应“稍后复习”。
- `unknown`：不认识，进入错词本和复习队列。

按钮和状态对应关系：

```text
认识 -> known
模糊 -> vague
不认识 -> unknown
```

### 5.2 整体进度结构

除了单词记录，还需要保存全局进度：

```ts
type AppProgress = {
  version: number;
  dailyGoal: number;
  currentWordIndex: number;
  today: string;
  todayStudiedIds: number[];
  records: Record<number, WordStudyRecord>;
  studyQueueIds?: number[];
  studyQueueMode?: string;
  studyQueueCreatedAt?: string;
};
```

新增字段说明：

- `studyQueueIds`：可选字段，保存当前背诵队列的单词 id 顺序。
- `studyQueueMode`：可选字段，记录生成队列时使用的设置，例如背诵范围、背诵顺序和是否过滤简单词。
- `studyQueueCreatedAt`：可选字段，记录队列生成时间。

本次功能更新不建议更换 `localStorage` key，仍然使用：

```text
metro-vocab-progress-v1
```

兼容策略：

- 旧数据没有 `studyQueueIds` 时，进入背单词页自动生成。
- 旧的 `records` 原样保留。
- `currentWordIndex` 继续表示“当前队列中的位置”，不是原始 Markdown 词表中的位置。
- 如果用户修改背诵范围或背诵顺序，可以重新生成队列，并将 `currentWordIndex` 重置为 0。

示例：

```json
{
  "version": 1,
  "dailyGoal": 20,
  "currentWordIndex": 35,
  "today": "2026-05-12",
  "todayStudiedIds": [31, 32, 33, 34, 35],
  "records": {
    "2": {
      "wordId": 2,
      "status": "unknown",
      "reviewCount": 3,
      "wrongCount": 2,
      "lastReviewAt": "2026-05-12T12:30:00.000Z",
      "nextReviewAt": "2026-05-13T12:30:00.000Z"
    }
  }
}
```

### 5.3 nextReviewAt 简单计算规则

第一版不做复杂记忆算法，但需要能指导复习页筛选。

建议规则：

- `known`：7 天后再复习。
- `vague`：1 天后复习。
- `unknown`：10 分钟后或当天稍后复习。

伪代码：

```ts
function getNextReviewAt(status: StudyStatus, now: Date): string {
  const next = new Date(now);

  if (status === "known") {
    next.setDate(next.getDate() + 7);
  }

  if (status === "vague") {
    next.setDate(next.getDate() + 1);
  }

  if (status === "unknown") {
    next.setMinutes(next.getMinutes() + 10);
  }

  return next.toISOString();
}
```

### 5.4 学习队列生成规则

随机背诵顺序需要使用稳定队列，不要在组件渲染时临时随机。

建议新增工具函数：

```ts
type BuildStudyQueueOptions = {
  studyRange: "全部" | "四/六" | "六级" | "四级补充";
  studyOrder: "az" | "random" | "unknown-first";
  skipSimpleWords: boolean;
  records: Record<number, WordStudyRecord>;
};

function buildStudyQueueIds(words: Word[], options: BuildStudyQueueOptions): number[] {
  // 1. 按背诵范围过滤
  // 2. 过滤 1 个字母的简单词
  // 3. 根据背诵顺序排序
  // 4. 返回 wordId 数组
}
```

排序规则：

- `az`：保持词表原始顺序。
- `random`：使用 Fisher-Yates 洗牌生成随机顺序。
- `unknown-first`：优先展示 `status === "unknown"` 或 `wrongCount > 0` 的单词，其余单词保持原顺序。

随机顺序要求：

- 只在生成队列时随机一次。
- 队列保存到 `localStorage`。
- 刷新页面后继续使用同一个队列。
- 设置变化后重新生成队列。

## 6. 页面路由设计

第一版建议使用 `react-router-dom`。

路由表：

```ts
const routes = [
  { path: "/", element: <HomePage /> },
  { path: "/study", element: <StudyPage /> },
  { path: "/review", element: <ReviewPage /> },
  { path: "/wrong-book", element: <WrongBookPage /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/settings", element: <SettingsPage /> },
];
```

### 6.1 首页 `/`

职责：

- 展示今日学习进度。
- 展示总掌握数量、待复习数量、错词数量。
- 提供入口：开始背单词、复习、错词本、搜索。

需要的数据：

- `words.length`
- `progress.dailyGoal`
- `progress.todayStudiedIds.length`
- `records` 统计结果

本次功能更新后，首页的总词数建议使用“当前可背词数”，而不是完整词库数量。当前可背词数需要考虑：

- 背诵范围设置。
- 简单词过滤规则。

搜索页和词表测试页仍然可以展示完整词库数量。

### 6.2 背单词页 `/study`

职责：

- 按 `currentWordIndex` 展示当前新词。
- 用户点击“认识 / 模糊 / 不认识”后保存记录。
- 自动跳到下一个单词。
- 达到今日目标后提示今日完成。

主要逻辑：

```text
读取 currentWordIndex
找到 words[currentWordIndex]
用户点击按钮
更新 records[word.id]
更新 todayStudiedIds
currentWordIndex + 1
保存到 localStorage
```

本次功能更新后，背单词页逻辑改为：

```text
读取完整词库
读取设置 settings
读取学习进度 progress
如果 progress 中没有可用 studyQueueIds，则生成学习队列
通过 studyQueueIds[currentWordIndex] 找到当前 wordId
再通过 wordId 找到当前单词
用户点击按钮
更新 records[word.id]
currentWordIndex + 1
保存到 localStorage
```

背单词页是随机顺序功能的主要受影响页面。

### 6.3 复习页 `/review`

职责：

- 展示到期需要复习的单词。
- 到期条件：`nextReviewAt <= now` 且状态不是完全陌生的新词。
- 用户复习后可以重新标记 `known`、`vague`、`unknown`。

筛选逻辑：

```ts
const dueRecords = Object.values(records).filter(
  (record) => new Date(record.nextReviewAt).getTime() <= Date.now()
);
```

### 6.4 错词本 `/wrong-book`

职责：

- 展示所有 `status === "unknown"` 或 `wrongCount > 0` 的单词。
- 支持按首字母或最近复习时间排序。
- 用户可以进入单词卡片重新复习。

第一版排序可以简单使用：

```text
wrongCount 高的排前面
```

### 6.5 搜索页 `/search`

职责：

- 根据英文单词搜索。
- 显示匹配单词的释义、标签和学习状态。

搜索规则：

- 输入为空时显示最近学过或不显示列表。
- 输入后使用 `word.includes(keyword)`。
- 搜索忽略大小写。

伪代码：

```ts
const keyword = query.trim().toLowerCase();
const result = words.filter((item) =>
  item.word.toLowerCase().includes(keyword)
);
```

搜索页不应该使用过滤后的学习队列，而应该继续搜索完整词库。这样用户仍然可以查到被跳过的简单词。

### 6.6 设置页 `/settings`

职责：

- 修改每日学习目标。
- 清空学习进度。
- 显示词表数量。
- 显示 PWA / 离线说明。

危险操作：

- 清空学习进度前必须二次确认。

本次功能更新后，设置页中的“背诵顺序”会影响背单词页的学习队列。

入口：

- 用户进入设置页。
- 在“背诵顺序”中选择“随机顺序”。
- 返回背单词页后，App 按随机队列展示单词。

如果设置发生变化，需要重新生成学习队列。为了避免破坏旧学习记录，只重置队列位置，不删除 `records`。

## 7. 本地存储方案

第一版使用 `localStorage`。

### 7.1 localStorage key

建议使用固定 key：

```ts
const STORAGE_KEY = "metro-vocab-progress-v1";
```

以后如果数据结构升级，可以改为：

```text
metro-vocab-progress-v2
```

或者通过 `version` 字段做迁移。

本次功能更新只新增可选字段，不需要更换 key。读取旧数据时，如果没有新字段，使用默认逻辑自动补齐。

### 7.2 读取进度

读取逻辑：

```ts
function loadProgress(): AppProgress {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return createDefaultProgress();
  }

  try {
    return JSON.parse(raw) as AppProgress;
  } catch {
    return createDefaultProgress();
  }
}
```

### 7.3 保存进度

保存逻辑：

```ts
function saveProgress(progress: AppProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
```

### 7.4 默认进度

```ts
function createDefaultProgress(): AppProgress {
  return {
    version: 1,
    dailyGoal: 20,
    currentWordIndex: 0,
    today: getTodayText(),
    todayStudiedIds: [],
    records: {},
  };
}
```

### 7.5 跨日期处理

每天第一次打开 App 时，需要判断日期是否变化。

规则：

- 如果 `progress.today` 等于今天，不处理。
- 如果不等于今天，把 `today` 改成今天，并清空 `todayStudiedIds`。
- 不清空 `records`，因为历史学习记录要保留。

伪代码：

```ts
function normalizeProgressDate(progress: AppProgress): AppProgress {
  const today = getTodayText();

  if (progress.today === today) {
    return progress;
  }

  return {
    ...progress,
    today,
    todayStudiedIds: [],
  };
}
```

## 8. PWA 离线缓存方案

建议使用：

```text
vite-plugin-pwa
```

### 8.1 需要缓存的内容

第一版需要离线可用，所以至少缓存：

- `index.html`
- 构建后的 JS 文件
- 构建后的 CSS 文件
- `words.json`
- `manifest.webmanifest`
- App 图标

### 8.2 缓存策略

推荐第一版使用 `generateSW`，配置简单。

思路：

- App shell 使用预缓存。
- `words.json` 作为静态资源一起进入构建产物。
- 更新时提示用户刷新。

示例配置方向：

```ts
VitePWA({
  registerType: "prompt",
  includeAssets: ["icons/icon-192.png", "icons/icon-512.png"],
  manifest: {
    name: "四六级地铁背单词",
    short_name: "地铁背词",
    display: "standalone",
    start_url: "/",
    theme_color: "#ffffff",
    background_color: "#ffffff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  }
});
```

### 8.3 离线体验要求

第一版需要保证：

- 第一次联网打开后，再断网也能进入首页。
- 断网时可以继续背单词。
- 学习记录仍然正常保存。
- 不显示依赖网络的错误页面。

### 8.4 更新策略

第一版可以做得简单：

- 检测到新版本时，在页面顶部或设置页显示“发现新版本，点击刷新”。
- 用户点击后刷新页面。

不建议第一版做自动强制刷新，因为用户可能正在背单词，突然刷新体验不好。

## 9. 第一版开发步骤

建议按以下顺序开发。

### 第一步：初始化项目

创建 React + TypeScript + Vite 项目，安装基础依赖：

```text
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom
npm install -D vite-plugin-pwa
```

注意：如果当前目录已经有文件，初始化前要确认不会覆盖已有文档和词表。

### 第二步：建立类型文件

创建：

```text
src/types/word.ts
src/types/progress.ts
```

先定义 `Word`、`WordTag`、`StudyStatus`、`WordStudyRecord`、`AppProgress`。

### 第三步：编写词表解析脚本

创建：

```text
scripts/parseWords.ts
```

实现：

- 读取 `CET4_CET6_5500_words_CN.md`。
- 只解析词条行。
- 生成 `src/data/words.json`。
- 输出解析数量。
- 输出不合法标签或无法解析的词条行。

### 第四步：实现本地存储工具

创建：

```text
src/utils/storage.ts
src/utils/date.ts
```

实现：

- `loadProgress`
- `saveProgress`
- `clearProgress`
- `createDefaultProgress`
- `normalizeProgressDate`

### 第五步：实现进度 Hook

创建：

```text
src/hooks/useProgress.ts
```

职责：

- 页面加载时读取进度。
- 点击按钮时更新进度。
- 每次更新后保存到 `localStorage`。

可以先把核心方法设计为：

```ts
markWord(wordId: number, status: StudyStatus): void
resetProgress(): void
setDailyGoal(goal: number): void
```

### 第六步：实现页面路由

创建页面：

```text
src/routes/HomePage.tsx
src/routes/StudyPage.tsx
src/routes/ReviewPage.tsx
src/routes/WrongBookPage.tsx
src/routes/SearchPage.tsx
src/routes/SettingsPage.tsx
```

并在 `App.tsx` 配置路由。

### 第七步：实现核心组件

优先做：

```text
src/components/WordCard.tsx
src/components/BottomNav.tsx
src/components/ProgressBar.tsx
```

第一版 UI 要手机优先，按钮要适合单手操作。

### 第八步：实现 PWA

配置：

```text
vite.config.ts
public/icons/
public/manifest.webmanifest
```

检查构建后是否生成 service worker。

### 第九步：打包验证

执行构建：

```text
npm run build
```

然后本地预览：

```text
npm run preview
```

在浏览器里检查：

- 首页是否能打开。
- 背单词是否能保存状态。
- 刷新后进度是否还在。
- 搜索是否正常。
- 离线后是否还能打开。

## 10. 测试方法

本项目测试分为四类：数据解析测试、纯函数测试、页面手动测试、PWA 测试。

### 10.1 数据解析测试

解析脚本运行后检查：

- `src/data/words.json` 存在。
- JSON 可以正常解析。
- 单词数量接近 5500。
- 第一个单词是 `a`。
- `id` 没有重复。
- `word`、`meaning`、`tag`、`alphabet` 都非空。

可以写一个简单命令验证 JSON：

```text
python -B -c "import json; data=json.load(open('src/data/words.json', encoding='utf-8')); print(len(data)); print(data[0])"
```

### 10.2 纯函数测试

对工具函数可以用直接调用方式测试，不需要一开始就引入复杂测试框架。

例如测试复习时间：

```text
python -B -c "print('use TypeScript build or small node script to verify date rules')"
```

真正实现后，更推荐用 Node 直接调用构建好的工具函数，或后续再引入 Vitest。

### 10.3 TypeScript 和构建测试

第一版最重要的自动检查：

```text
npm run build
```

它可以同时检查：

- TypeScript 类型是否通过。
- Vite 是否能成功打包。
- JSON import 是否正常。
- PWA 插件配置是否基本可用。

### 10.4 页面手动测试清单

首页：

- 能看到今日进度。
- 点击“开始学习”进入背单词页。
- 点击“复习”进入复习页。
- 开启简单词过滤后，总词数应小于或等于完整词表数量。

背单词页：

- 能看到单词、释义、标签。
- 点击“认识”后进入下一个词。
- 点击“模糊”后记录为 `vague`。
- 点击“不认识”后记录为 `unknown`。
- 今日学习数量会增加。
- 刷新页面后进度不丢失。
- 默认不展示 1 个字母的简单词。
- 设置为随机顺序后，单词不再按 Markdown 原始顺序出现。
- 刷新页面后随机顺序保持稳定，不重新洗牌。

复习页：

- 到期复习的单词会出现。
- 复习后可以更新状态。
- 没有复习词时显示空状态。

错词本：

- 不认识的单词会出现。
- `wrongCount` 高的词排在前面。

搜索页：

- 输入英文能搜索。
- 大小写不影响搜索。
- 搜索结果显示学习状态。

设置页：

- 可以修改每日目标。
- 清空进度前有确认。
- 清空后首页统计归零。
- 修改“背诵顺序”为随机顺序后，背单词页使用随机队列。
- 修改背诵范围后，背单词页重新生成学习队列。

### 10.7 本次功能更新测试方法

本次更新完成后建议测试：

1. 词库解析仍然是 5500 条左右，说明解析逻辑没有删词。
2. 首页总词数显示为当前可背词数，过滤 1 个字母词后应小于完整词库数量。
3. 背单词页第一屏不再出现 `a` 这类 1 个字母单词。
4. 设置页选择“随机顺序”后，进入背单词页，单词顺序不再是 `a`、`abandon`、`abandonment` 这种原始顺序。
5. 刷新背单词页后，当前队列顺序保持稳定。
6. 点击“认识 / 模糊 / 不认识”后，旧学习记录结构仍然正常写入。
7. 搜索页仍能搜索完整词库，包括被背单词页跳过的简单词。
8. 错词本仍能显示旧记录中的错词。
9. `npm run build` 通过。

### 10.5 PWA 手动测试

构建并预览后检查：

- 浏览器 DevTools 的 Application 面板里能看到 Service Worker。
- Manifest 正常加载。
- 图标正常显示。
- 首次联网访问后，切到 Offline 模式，刷新页面仍能打开。
- 离线状态下学习记录仍能保存。

### 10.6 Windows 沙箱下的测试注意事项

本项目不要默认直接运行 `pytest`。

如果需要做 Python 层面的简单验证，优先使用：

```text
python -B -c "..."
```

原因是 Windows 沙箱下 `pytest` 可能因为 `Temp`、`.pytest_cache`、`__pycache__` 权限问题失败。

如果后续确实必须运行完整 pytest，需要先请求授权再执行。

## 11. 第一版完成标准

第一版可以认为完成，需要满足：

- 词表成功转换为 JSON。
- 手机浏览器可以打开首页。
- 用户可以背新词。
- 用户可以标记 `known`、`vague`、`unknown`。
- 学习记录刷新后不丢失。
- 复习页能展示到期复习词。
- 错词本能展示不认识的词。
- 搜索页能按英文搜索单词。
- 设置页能修改每日目标和清空进度。
- 构建成功。
- PWA 可以离线打开。

这个完成标准是第一版开发时的验收清单。后续写代码时，每完成一个模块，都可以对照这里检查。
