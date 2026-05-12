import type { VocabWord } from "../types/vocab";
import type { StudyOrder, StudyRange } from "./settingsStorage";
import type { WordStudyRecord } from "./studyStorage";

export const SKIP_SIMPLE_WORDS = true;

export interface BuildStudyQueueOptions {
  studyRange: StudyRange;
  studyOrder: StudyOrder;
  skipSimpleWords: boolean;
  records: Record<number, WordStudyRecord>;
}

function shouldSkipSimpleWord(word: VocabWord) {
  return word.word.trim().length <= 1;
}

function filterByStudyRange(words: VocabWord[], studyRange: StudyRange) {
  if (studyRange === "全部") {
    return words;
  }

  return words.filter((word) => word.tag === studyRange);
}

function shuffleWords(words: VocabWord[]) {
  const shuffledWords = [...words];

  // Fisher-Yates 洗牌：只在生成学习队列时随机一次，避免刷新页面后顺序乱跳。
  for (let index = shuffledWords.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const currentWord = shuffledWords[index];
    shuffledWords[index] = shuffledWords[randomIndex];
    shuffledWords[randomIndex] = currentWord;
  }

  return shuffledWords;
}

function sortUnknownWordsFirst(words: VocabWord[], records: Record<number, WordStudyRecord>) {
  return [...words].sort((left, right) => {
    const leftRecord = records[left.id];
    const rightRecord = records[right.id];
    const leftScore = leftRecord?.status === "unknown" || (leftRecord?.wrongCount ?? 0) > 0 ? 1 : 0;
    const rightScore =
      rightRecord?.status === "unknown" || (rightRecord?.wrongCount ?? 0) > 0 ? 1 : 0;

    return rightScore - leftScore;
  });
}

export function getStudyWords(
  words: VocabWord[],
  options: Pick<BuildStudyQueueOptions, "studyRange" | "skipSimpleWords">,
) {
  const rangedWords = filterByStudyRange(words, options.studyRange);

  if (!options.skipSimpleWords) {
    return rangedWords;
  }

  return rangedWords.filter((word) => !shouldSkipSimpleWord(word));
}

export function getStudyQueueMode(options: Omit<BuildStudyQueueOptions, "records">) {
  return [
    `range=${options.studyRange}`,
    `order=${options.studyOrder}`,
    `skipSimple=${String(options.skipSimpleWords)}`,
  ].join(";");
}

export function buildStudyQueueIds(words: VocabWord[], options: BuildStudyQueueOptions) {
  const studyWords = getStudyWords(words, options);

  if (options.studyOrder === "random") {
    return shuffleWords(studyWords).map((word) => word.id);
  }

  if (options.studyOrder === "unknown-first") {
    return sortUnknownWordsFirst(studyWords, options.records).map((word) => word.id);
  }

  return studyWords.map((word) => word.id);
}
