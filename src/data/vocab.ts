import vocabMarkdown from "./CET4_CET6_5500_words_CN.md?raw";
import { parseVocabMarkdown } from "../utils/parseVocabMarkdown";

// 统一词表解析入口：页面直接使用这里的结果，避免每个页面重复解析 Markdown。
export const vocabWords = parseVocabMarkdown(vocabMarkdown);

// 用 wordId 快速查单词详情，错词本、生词本、复习页都会用到。
export const wordMap = new Map(vocabWords.map((word) => [word.id, word]));
