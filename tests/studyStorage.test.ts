import { describe, expect, it } from "vitest";
import { calculateNextReviewAt } from "../src/utils/studyStorage";

function diffInMinutes(left: string, right: Date) {
  return Math.round((new Date(left).getTime() - right.getTime()) / 60_000);
}

describe("calculateNextReviewAt", () => {
  const now = new Date("2026-05-12T08:00:00.000Z");

  it("known 第一次认识后约 3 天后复习", () => {
    expect(diffInMinutes(calculateNextReviewAt("known", 1, now), now)).toBe(3 * 24 * 60);
  });

  it("vague 约 1 天后复习", () => {
    expect(diffInMinutes(calculateNextReviewAt("vague", 0, now), now)).toBe(24 * 60);
  });

  it("unknown 约 30 分钟后复习", () => {
    expect(diffInMinutes(calculateNextReviewAt("unknown", 0, now), now)).toBe(30);
  });

  it("连续认识次数不同，复习间隔不同", () => {
    expect(diffInMinutes(calculateNextReviewAt("known", 2, now), now)).toBe(7 * 24 * 60);
    expect(diffInMinutes(calculateNextReviewAt("known", 3, now), now)).toBe(15 * 24 * 60);
    expect(diffInMinutes(calculateNextReviewAt("known", 4, now), now)).toBe(30 * 24 * 60);
  });
});
