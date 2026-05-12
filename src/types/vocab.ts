export type VocabTag = "四/六" | "六级" | "四级补充";

export interface VocabWord {
  id: number;
  word: string;
  meaning: string;
  tag: VocabTag;
  alphabet: string;
}
