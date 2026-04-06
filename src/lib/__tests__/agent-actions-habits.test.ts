import { beforeEach, describe, expect, it, vi } from "vitest";

const habitFindManyMock = vi.fn();
const habitCreateMock = vi.fn();
const habitUpdateMock = vi.fn();
const habitFindUniqueMock = vi.fn();
const habitLogCreateMock = vi.fn();
const habitLogUpdateMock = vi.fn();
const habitLogFindManyMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    habit: {
      findMany: habitFindManyMock,
      create: habitCreateMock,
      update: habitUpdateMock,
      findUnique: habitFindUniqueMock,
    },
    habitLog: {
      create: habitLogCreateMock,
      update: habitLogUpdateMock,
      findMany: habitLogFindManyMock,
    },
  },
}));

const { executeAgentTool } = await import("@/lib/agent-actions");

describe("executeAgentTool habits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates habit", async () => {
    habitCreateMock.mockResolvedValue({ id: "h1", name: "Read" });

    const result = await executeAgentTool("create_habit", {
      name: "Read",
      description: "30 min",
    });

    expect(result.ok).toBe(true);
    expect(habitCreateMock).toHaveBeenCalledWith({
      data: {
        name: "Read",
        description: "30 min",
        projectId: null,
      },
      include: {
        logs: true,
      },
    });
  });

  it("sets habit completion", async () => {
    habitFindUniqueMock
      .mockResolvedValueOnce({ id: "h1", logs: [] })
      .mockResolvedValueOnce({ id: "h1", logs: [{ id: "l1", date: "2026-04-06", completed: true }] });

    habitLogFindManyMock.mockResolvedValue([{ id: "l1", date: "2026-04-06", completed: true }]);

    const result = await executeAgentTool("set_habit_completion", {
      habitId: "h1",
      date: "2026-04-06",
      completed: true,
    });

    expect(result.ok).toBe(true);
    expect(habitLogCreateMock).toHaveBeenCalledWith({
      data: {
        habitId: "h1",
        date: "2026-04-06",
        completed: true,
      },
    });
    expect(habitUpdateMock).toHaveBeenCalled();
  });
});
