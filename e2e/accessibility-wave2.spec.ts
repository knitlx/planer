import { test, expect } from "@playwright/test";

test.describe("Wave 2 accessibility checks", () => {
  test("quick collect shows cross-platform shortcut hint and labeled input", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Ctrl/⌘ + K")).toBeVisible();
    await expect(page.getByLabel("Быстрый ввод идеи")).toBeVisible();
  });

  test("sidebar quick collect modal exposes labeled textarea", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Быстрый сбор" }).first().click();
    const modal = page.getByRole("dialog", { name: "Быстрый сбор" });
    await expect(modal).toBeVisible();
    await expect(modal.getByLabel("Текст быстрой заметки")).toBeVisible();
  });

  test("idea delete action has explicit accessible name", async ({ page, request }) => {
    const suffix = Date.now().toString();
    const ideaContent = `E2E A11y Idea ${suffix}`;
    let createdIdeaId: string | null = null;

    try {
      const createIdeaResponse = await request.post("/api/ideas", {
        data: { content: ideaContent },
      });
      expect(createIdeaResponse.ok()).toBeTruthy();
      const createdIdea = (await createIdeaResponse.json()) as { id: string };
      createdIdeaId = createdIdea.id;

      await page.goto("/ideas");
      const ideaText = page.getByText(ideaContent, { exact: true });
      await expect(ideaText).toBeVisible();
      const ideaCard = ideaText.locator("xpath=ancestor::div[contains(@class,'p-4')][1]");
      await expect(ideaCard.getByRole("button", { name: "Удалить идею" })).toBeVisible();
    } finally {
      if (createdIdeaId) {
        await request.delete(`/api/ideas/${createdIdeaId}`).catch(() => null);
      }
    }
  });
});
