import { describe, expect, it } from "vitest";
import { buildContextForModel, type UserFacingMessage } from "@/lib/ai-agent";

function makeMessages(count: number): UserFacingMessage[] {
  return Array.from({ length: count }).map((_, index) => ({
    role: index % 2 === 0 ? "user" : "assistant",
    content: `message-${index + 1}`,
  }));
}

describe("buildContextForModel", () => {
  it("keeps short history without summary", () => {
    const input = makeMessages(6);
    const context = buildContextForModel(input, "PLAN", "BRIEF");

    expect(context[0].role).toBe("system");
    expect(context).toHaveLength(10);
    expect(context[1].role).toBe("system");
    expect(context[2].role).toBe("system");
    expect(context[3].role).toBe("system");
    expect(context[4]).toMatchObject({ role: "user", content: "message-1" });
  });

  it("adds summary and keeps only recent window for long history", () => {
    const input = makeMessages(40);
    const context = buildContextForModel(input, "BUILD", "DEEP");

    const systemMessages = context.filter((msg) => msg.role === "system");
    expect(systemMessages.length).toBe(5);
    expect(systemMessages[3].content).toContain("Сжатый контекст ранней части диалога");
    expect(systemMessages[3].content).toContain("Пакет 1-5");
    expect(systemMessages[4].content).toContain("Оперативная память");

    const nonSystem = context.filter((msg) => msg.role !== "system");
    expect(nonSystem.length).toBe(10);
    expect(nonSystem[0]).toMatchObject({ content: "message-31" });
    expect(nonSystem[9]).toMatchObject({ content: "message-40" });
  });
});
