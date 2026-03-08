import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    reminderTriggerConfig: {
      findMany: findManyMock,
      update: updateMock,
    },
  },
}));

const { GET, PUT } = await import("@/app/api/reminders/triggers/route");

describe("/api/reminders/triggers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns reminder trigger configs", async () => {
    findManyMock.mockResolvedValue([
      { id: "cfg-1", type: "MANDATORY_STALE" },
      { id: "cfg-2", type: "MANDATORY_IGNORED" },
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveLength(2);
    expect(findManyMock).toHaveBeenCalledWith({ orderBy: { type: "asc" } });
  });

  it("updates trigger config fields", async () => {
    updateMock.mockResolvedValue({ id: "cfg-1", thresholdDays: 3, cooldownHours: 12, enabled: true });

    const response = await PUT(
      new Request("http://localhost/api/reminders/triggers", {
        method: "PUT",
        body: JSON.stringify({ id: "cfg-1", thresholdDays: 3, cooldownHours: 12, enabled: true }),
      }),
    );

    const payload = await response.json();

    expect(payload).toMatchObject({ id: "cfg-1" });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "cfg-1" },
      data: { thresholdDays: 3, cooldownHours: 12, enabled: true },
    });
  });

  it("rejects updates without fields", async () => {
    const response = await PUT(
      new Request("http://localhost/api/reminders/triggers", {
        method: "PUT",
        body: JSON.stringify({ id: "cfg-1" }),
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error?.code).toBe("VALIDATION_ERROR");
  });
});
