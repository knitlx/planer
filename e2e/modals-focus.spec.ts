import { test, expect } from "@playwright/test";

test.describe("Modal focus behavior", () => {
  test("modal has explicit close button name for accessibility", async ({ page, request }) => {
    const suffix = Date.now().toString();
    const ideaContent = `E2E Close Label ${suffix}`;
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
      await ideaCard.getByRole("button", { name: "Проект" }).first().click();

      const modal = page.getByRole("dialog", { name: "Преобразовать в проект" });
      await expect(modal).toBeVisible();
      await expect(modal.getByRole("button", { name: "Закрыть" })).toBeVisible();
    } finally {
      if (createdIdeaId) {
        await request.delete(`/api/ideas/${createdIdeaId}`).catch(() => null);
      }
    }
  });

  test("convert-to-project modal keeps focus in project name input while typing", async ({ page, request }) => {
    const suffix = Date.now().toString();
    const ideaContent = `E2E Idea ${suffix}`;
    const projectName = `E2E Project ${suffix}`;
    let createdIdeaId: string | null = null;
    let createdProjectId: string | null = null;

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
      await ideaCard.getByRole("button", { name: "Проект" }).first().click();

      const modal = page.getByRole("dialog", { name: "Преобразовать в проект" });
      await expect(modal).toBeVisible();

      const projectNameInput = modal.getByPlaceholder("Введите название проекта");
      await projectNameInput.click();
      await expect(projectNameInput).toBeFocused();

      let typedValue = "";
      for (const char of projectName) {
        await page.keyboard.type(char);
        typedValue += char;
        await expect(projectNameInput).toHaveValue(typedValue);
        await expect(projectNameInput).toBeFocused();
      }

      await modal.getByRole("button", { name: "Создать проект" }).click();
      await expect(modal).toBeHidden();

      await page.goto("/projects");
      await expect(page.getByRole("heading", { name: projectName }).first()).toBeVisible();

      const projectsResponse = await request.get("/api/projects");
      expect(projectsResponse.ok()).toBeTruthy();
      const projects = (await projectsResponse.json()) as Array<{ id: string; name: string }>;
      const createdProject = projects.find((project) => project.name === projectName);
      expect(createdProject).toBeDefined();
      createdProjectId = createdProject?.id ?? null;
    } finally {
      if (createdIdeaId) {
        await request.delete(`/api/ideas/${createdIdeaId}`);
      }
      if (createdProjectId) {
        await request.delete(`/api/projects/${createdProjectId}`);
      }
    }
  });
});
