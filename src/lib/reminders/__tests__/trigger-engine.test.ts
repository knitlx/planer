import { describe, it, expect } from "vitest";
import { evaluateMandatoryStale } from "../trigger-engine";

describe("evaluateMandatoryStale", () => {
  const daysAgo = (days: number) => {
    const now = new Date();
    const date = new Date(now);
    date.setUTCDate(now.getUTCDate() - days);
    return date;
  };

  it("flags mandatory projects older than threshold", async () => {
    const projects = [
      {
        id: "p1",
        type: "MANDATORY",
        lastActive: daysAgo(3),
        tasks: [{ status: "TODO" }],
      },
    ];

    const config = {
      id: "cfg1",
      type: "MANDATORY_STALE" as const,
      thresholdDays: 2,
      cooldownHours: 24,
    };

    const result = await evaluateMandatoryStale(projects as any, config as any);
    expect(result).toHaveLength(1);
  });
});
