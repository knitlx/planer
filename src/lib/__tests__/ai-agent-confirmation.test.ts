import { describe, expect, it } from "vitest";
import { isDeleteToolCallConfirmed } from "@/lib/ai-agent";

describe("isDeleteToolCallConfirmed", () => {
  it("returns false when confirmation text does not match", () => {
    expect(isDeleteToolCallConfirmed("delete_task", { id: "task-1" }, "да")).toBe(false);
  });

  it("returns true for explicit matching confirmation command", () => {
    expect(
      isDeleteToolCallConfirmed(
        "delete_task",
        { id: "task-1" },
        "CONFIRM_DELETE delete_task task-1",
      ),
    ).toBe(true);
  });

  it("returns false for mismatched id", () => {
    expect(
      isDeleteToolCallConfirmed(
        "delete_project",
        { id: "project-1" },
        "CONFIRM_DELETE delete_project project-2",
      ),
    ).toBe(false);
  });
});
