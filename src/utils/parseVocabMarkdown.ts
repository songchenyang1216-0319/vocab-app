import type { VocabTag, VocabWord } from "../types/vocab";

const ALLOWED_TAGS: VocabTag[] = ["四/六", "六级", "四级补充"];

// 匹配一行标准词条，例如：
// 0002. **abandon** — vt. 离弃，丢弃；遗弃，抛弃；放弃 n. 放任；纵情 `[四/六]`
const VOCAB_LINE_PATTERN = /^(\d{4})\.\s+\*\*(.+?)\*\*\s+—\s+(.+?)\s+`\[(.+?)\]`$/;

function isVocabTag(tag: string): tag is VocabTag {
  return ALLOWED_TAGS.includes(tag as VocabTag);
}

function createParseError(message: string, details: string[]) {
  const detailText = details.length > 0 ? `\n${details.join("\n")}` : "";

  return new Error(`${message}${detailText}`);
}

export interface ParseVocabMarkdownOptions {
  minCount?: number;
  maxCount?: number;
}

export function parseVocabMarkdown(
  markdownText: string,
  options: ParseVocabMarkdownOptions = {},
): VocabWord[] {
  const minCount = options.minCount ?? 5000;
  const maxCount = options.maxCount ?? 6000;
  const words: VocabWord[] = [];
  const invalidLines: string[] = [];
  const invalidTags: string[] = [];
  const usedIds = new Set<number>();

  markdownText.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();

    // 标题、说明、空行都不以 4 位编号开头，直接跳过。
    if (!line || !/^\d{4}\./.test(line)) {
      return;
    }

    const match = line.match(VOCAB_LINE_PATTERN);

    if (!match) {
      invalidLines.push(`第 ${index + 1} 行格式不正确：${line}`);
      return;
    }

    const [, idText, rawWord, rawMeaning, rawTag] = match;
    const id = Number(idText);
    const word = rawWord.trim();
    const meaning = rawMeaning.trim();
    const tag = rawTag.trim();

    if (!word || !meaning) {
      invalidLines.push(`第 ${index + 1} 行单词或释义为空：${line}`);
      return;
    }

    if (!isVocabTag(tag)) {
      invalidTags.push(`第 ${index + 1} 行发现未知标签：${tag}`);
      return;
    }

    if (usedIds.has(id)) {
      invalidLines.push(`第 ${index + 1} 行编号重复：${idText}`);
      return;
    }

    usedIds.add(id);
    words.push({
      id,
      word,
      meaning,
      tag,
      alphabet: word[0].toUpperCase(),
    });
  });

  if (invalidLines.length > 0 || invalidTags.length > 0) {
    throw createParseError("词表解析失败，请检查以下问题：", [...invalidLines, ...invalidTags]);
  }

  if (words.length === 0) {
    throw createParseError("词表解析失败：没有解析到任何单词。", [
      "请确认 Markdown 文本中存在类似 `0001. **word** — meaning `[标签]`` 的词条。",
    ]);
  }

  if (words.length < minCount || words.length > maxCount) {
    throw createParseError(`词表解析数量异常：当前解析到 ${words.length} 条。`, [
      "预期数量应在 5500 条左右，请检查词表文件是否完整。",
    ]);
  }

  console.info(`词表解析完成：共解析 ${words.length} 条单词。`);

  return words;
}
