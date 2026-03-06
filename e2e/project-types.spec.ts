import { test, expect } from "@playwright/test";

test.describe("Project types - mandatory and normal", () => {
  test("mandatory projects show first and unlock normal projects when completed", async ({ page, request }) => {
    const suffix = Date.now().toString();
    const mandatoryProjectName = `E2E Mandatory ${suffix}`;
    const normalProjectName = `E2E Normal ${suffix}`;
    let mandatoryProjectId: string | null = null;
    let normalProjectId: string | null = null;

    try {
      // Create mandatory project
      const mandatoryRes = await request.post("/api/projects", {
        data: { name: mandatoryProjectName, weight: 5, friction: 5, type: "MANDATORY" },
      });
      expect(mandatoryRes.ok()).toBeTruthy();
      const mandatoryProject = (await mandatoryRes.json()) as { id: string };
      mandatoryProjectId = mandatoryProject.id;

      // Create normal project
      const normalRes = await request.post("/api/projects", {
        data: { name: normalProjectName, weight: 5, friction: 5, type: "NORMAL" },
      });
      expect(normalRes.ok()).toBeTruthy();
      const normalProject = (await normalRes.json()) as { id: string };
      normalProjectId = normalProject.id;

      await page.goto("/focus");

      // Check mandatory project is visible
      await expect(page.getByText(mandatoryProjectName)).toBeVisible();

      // Check mandatory section is visible
      await expect(page.getByText("Обязательные")).toBeVisible();

      // Check normal projects are hidden initially (should show "Показать остальные проекты")
      await expect(page.getByText(`Показать остальные проекты`)).toBeVisible();

      // Mark mandatory project as completed today
      await page.getByRole("button", { name: "Отметить сегодня" }).click();

      // Wait for update and check that normal projects are now visible
      await expect(page.getByText(normalProjectName)).toBeVisible();

      // Check that the unlock section is visible
      await expect(page.getByText("Остальные проекты")).toBeVisible();

    } finally {
      // Cleanup
      if (mandatoryProjectId) {
        await request.delete(`/api/projects/${mandatoryProjectId}`);
      }
      if (normalProjectId) {
        await request.delete(`/api/projects/${normalProjectId}`);
      }
    }
  });
});
