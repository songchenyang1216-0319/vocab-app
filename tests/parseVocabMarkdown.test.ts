import { describe, expect, it } from "vitest";
import { parseVocabMarkdown } from "../src/utils/parseVocabMarkdown";

describe("parseVocabMarkdown", () => {
  it("能正确解析合法词条", () => {
    const markdown = [
      "# 测试词表",
      "",
      "0001. **abandon** — vt. 离弃，丢弃；放弃 `[四/六]`",
      "0002. **ability** — n. 能力；才能 `[六级]`",
    ].join("\n");

    const words = parseVocabMarkdown(markdown, { minCount: 1, maxCount: 10 });

    expect(words).toEqual([
      {
        id: 1,
        word: "abandon",
        meaning: "vt. 离弃，丢弃；放弃",
        tag: "四/六",
        alphabet: "A",
      },
      {
        id: 2,
        word: "ability",
        meaning: "n. 能力；才能",
        tag: "六级",
        alphabet: "A",
      },
    ]);
  });

  it("遇到格式错误会抛错", () => {
    const markdown = "0001. **abandon** - vt. 离弃 `[四/六]`";

    expect(() => parseVocabMarkdown(markdown, { minCount: 1, maxCount: 10 })).toThrow(
      "格式不正确",
    );
  });

  it("遇到未知标签会抛错", () => {
    const markdown = "0001. **abandon** — vt. 离弃 `[考研]`";

    expect(() => parseVocabMarkdown(markdown, { minCount: 1, maxCount: 10 })).toThrow(
      "未知标签",
    );
  });
});
