import { describe, expect, it } from "vitest";
import type { VocabWord } from "../src/types/vocab";
import type { WordStudyRecord } from "../src/utils/studyStorage";
import { buildStudyQueueIds } from "../src/utils/studyWords";

const words: VocabWord[] = [
  { id: 1, word: "a", meaning: "art. 一", tag: "四级补充", alphabet: "A" },
  { id: 2, word: "apple", meaning: "n. 苹果", tag: "四/六", alphabet: "A" },
  { id: 3, word: "banana", meaning: "n. 香蕉", tag: "六级", alphabet: "B" },
  { id: 4, word: "cat", meaning: "n. 猫", tag: "四/六", alphabet: "C" },
];

function createRecord(
  wordId: number,
  status: WordStudyRecord["status"],
  wrongCount = 0,
): WordStudyRecord {
  return {
    wordId,
    status,
    reviewCount: 1,
    wrongCount,
    correctStreak: status === "known" ? 1 : 0,
    lastReviewAt: "2026-05-12T08:00:00.000Z",
    nextReviewAt: "2026-05-13T08:00:00.000Z",
  };
}

describe("buildStudyQueueIds", () => {
  it("按范围过滤", () => {
    const ids = buildStudyQueueIds(words, {
      studyRange: "六级",
      studyOrder: "az",
      skipSimpleWords: true,
      records: {},
    });

    expect(ids).toEqual([3]);
  });

  it("az 顺序会保留词表原始顺序，并跳过简单词", () => {
    const ids = buildStudyQueueIds(words, {
      studyRange: "全部",
      studyOrder: "az",
      skipSimpleWords: true,
      records: {},
    });

    expect(ids).toEqual([2, 3, 4]);
  });

  it("unknown-first 优先把不认识或错词放前面", () => {
    const ids = buildStudyQueueIds(words, {
      studyRange: "全部",
      studyOrder: "unknown-first",
      skipSimpleWords: true,
      records: {
        2: createRecord(2, "known"),
        3: createRecord(3, "unknown"),
        4: createRecord(4, "vague", 2),
      },
    });

    expect(ids.slice(0, 2).sort((left, right) => left - right)).toEqual([3, 4]);
    expect(ids[2]).toBe(2);
  });
});
