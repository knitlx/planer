import { test, expect } from "@playwright/test";

test.describe("Focus project back navigation", () => {
  test("opens project from projects page with keyboard", async ({ page, request }) => {
    const suffix = Date.now().toString();
    const projectName = `E2E Keyboard ${suffix}`;
    let projectId: string | null = null;

    try {
      const projectRes = await request.post("/api/projects", {
        data: { name: projectName, weight: 5, friction: 5 },
      });
      expect(projectRes.ok()).toBeTruthy();
      const project = (await projectRes.json()) as { id: string };
      projectId = project.id;

      await page.goto("/projects");
      const projectHeading = page.getByRole("heading", { name: projectName });
      await expect(projectHeading).toBeVisible();

      const projectCard = projectHeading.locator("xpath=ancestor::button[1]");
      await projectCard.focus();
      await page.keyboard.press("Enter");

      await expect(page).toHaveURL(new RegExp(`/focus/${projectId}$`));
    } finally {
      if (projectId) {
        await request.delete(`/api/projects/${projectId}`).catch(() => null);
      }
    }
  });

  test("returns to projects page when opened from projects list", async ({ page, request }) => {
    const suffix = Date.now().toString();
    const projectName = `E2E Back ${suffix}`;
    let projectId: string | null = null;

    try {
      const projectRes = await request.post("/api/projects", {
        data: { name: projectName, weight: 5, friction: 5 },
      });
      expect(projectRes.ok()).toBeTruthy();
      const project = (await projectRes.json()) as { id: string };
      projectId = project.id;

      await page.goto("/projects");
      await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
      await page.getByRole("heading", { name: projectName }).click();

      await expect(page).toHaveURL(new RegExp(`/focus/${projectId}$`));
      await page.getByRole("button", { name: "Назад" }).click();

      await expect(page).toHaveURL(/\/projects$/);
      await expect(page.getByRole("heading", { name: "Проекты", exact: true })).toBeVisible();
    } finally {
      if (projectId) {
        await request.delete(`/api/projects/${projectId}`).catch(() => null);
      }
    }
  });
});
