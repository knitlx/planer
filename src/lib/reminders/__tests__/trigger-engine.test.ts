import { describe, it, expect } from "vitest";
import { evaluateMandatoryStale } from "../trigger-engine";

describe("evaluateMandatoryStale", () => {
  const daysAgo = (now: Date, days: number) => {
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - days);
    return date;
  };

  it("flags mandatory projects older than threshold", async () => {
    const now = new Date("2026-03-08T12:00:00Z");
    const projects = [
      {
        id: "p1",
        type: "MANDATORY",
        lastActive: daysAgo(now, 3),
        tasks: [{ status: "TODO" }],
      },
    ];

    const result = await evaluateMandatoryStale(projects as any, 2, now);
    expect(result).toHaveLength(1);
  });
});
