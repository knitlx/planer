import { beforeEach, describe, expect, it, vi } from "vitest";

const findManyMock = vi.fn();
const createMock = vi.fn();
const updateMock = vi.fn();

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    newsSource: {
      findMany: findManyMock,
      create: createMock,
      update: updateMock,
    },
  },
}));

const { GET, POST, PUT, DELETE } = await import("@/app/api/news/sources/route");

describe("/api/news/sources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns news sources", async () => {
    findManyMock.mockResolvedValue([{ id: "src-1" }]);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toHaveLength(1);
    expect(findManyMock).toHaveBeenCalledWith({ orderBy: { createdAt: "desc" } });
  });

  it("creates a news source", async () => {
    createMock.mockResolvedValue({ id: "src-1" });

    const response = await POST(
      new Request("http://localhost/api/news/sources", {
        method: "POST",
        body: JSON.stringify({ name: "AI Hub", type: "RSS", url: "https://example" }),
      }),
    );

    expect(response.status).toBe(201);
    expect(createMock).toHaveBeenCalledWith({ data: { name: "AI Hub", type: "RSS", url: "https://example" } });
  });

  it("updates a news source", async () => {
    updateMock.mockResolvedValue({ id: "src-1" });

    const response = await PUT(
      new Request("http://localhost/api/news/sources", {
        method: "PUT",
        body: JSON.stringify({ id: "src-1", enabled: false }),
      }),
    );

    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "src-1" },
      data: { enabled: false },
    });
  });

  it("soft deletes a source", async () => {
    updateMock.mockResolvedValue({ id: "src-1", enabled: false });

    const response = await DELETE(
      new Request("http://localhost/api/news/sources", {
        method: "DELETE",
        body: JSON.stringify({ id: "src-1" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(updateMock).toHaveBeenCalledWith({
      where: { id: "src-1" },
      data: { enabled: false },
    });
  });

  it("fails validation on missing body", async () => {
    const response = await POST(
      new Request("http://localhost/api/news/sources", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
  });
});
