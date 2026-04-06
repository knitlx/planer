import { describe, expect, it, vi, beforeEach } from "vitest";

const findManyProjectsMock = vi.fn();
const createTaskMock = vi.fn();
const updateProjectMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    project: {
      findMany: findManyProjectsMock,
      update: updateProjectMock,
    },
    task: {
      create: createTaskMock,
    },
  },
}));

const { executeAgentTool } = await import("@/lib/agent-actions");

describe("executeAgentTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists projects", async () => {
    findManyProjectsMock.mockResolvedValue([{ id: "p1", name: "Alpha" }]);

    const result = await executeAgentTool("list_projects", {});

    expect(result.ok).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(findManyProjectsMock).toHaveBeenCalledWith({
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { tasks: true },
    });
  });

  it("creates task with defaults", async () => {
    createTaskMock.mockResolvedValue({ id: "t1", title: "Новая" });

    const result = await executeAgentTool("create_task", {
      projectId: "p1",
      title: "Новая",
    });

    expect(result.ok).toBe(true);
    expect(createTaskMock).toHaveBeenCalledWith({
      data: {
        projectId: "p1",
        title: "Новая",
        type: "ACTION",
        status: "TODO",
        order: 0,
        contextSummary: null,
      },
    });
  });

  it("updates project name", async () => {
    updateProjectMock.mockResolvedValue({ id: "p1", name: "Renamed" });

    const result = await executeAgentTool("update_project", {
      id: "p1",
      name: "Renamed",
    });

    expect(result.ok).toBe(true);
    expect(updateProjectMock).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: {
        name: "Renamed",
        description: undefined,
        weight: undefined,
        friction: undefined,
        status: undefined,
        type: undefined,
      },
    });
  });
});
