import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    digestWindowConfig: {
      findMany: findManyMock,
      update: updateMock,
    },
  },
}));

const { GET, PUT } = await import("@/app/api/news/windows/route");

describe("/api/news/windows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns digest windows sorted by time", async () => {
    findManyMock.mockResolvedValue([
      { id: "win-1", timeUtc: "08:00" },
      { id: "win-2", timeUtc: "12:00" },
    ]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveLength(2);
    expect(findManyMock).toHaveBeenCalledWith({ orderBy: { timeUtc: "asc" } });
  });

  it("updates window fields", async () => {
    updateMock.mockResolvedValue({ id: "win-1", slug: "MORNING" });

    const response = await PUT(
      new Request("http://localhost/api/news/windows", {
        method: "PUT",
        body: JSON.stringify({ id: "win-1", slug: "MORNING", maxItems: 7 }),
      }),
    );
    const payload = await response.json();

    expect(payload).toMatchObject({ id: "win-1" });
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "win-1" },
      data: { slug: "MORNING", maxItems: 7 },
    });
  });

  it("rejects invalid time format", async () => {
    const response = await PUT(
      new Request("http://localhost/api/news/windows", {
        method: "PUT",
        body: JSON.stringify({ id: "win-1", timeUtc: "7am" }),
      }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error?.code).toBe("VALIDATION_ERROR");
  });
});
