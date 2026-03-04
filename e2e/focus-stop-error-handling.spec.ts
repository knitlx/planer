import { test, expect } from "@playwright/test";

test.describe("Focus room stop error handling", () => {
  test("allows leaving focus room when status save fails", async ({ page, request }) => {
    const suffix = Date.now().toString();
    const projectName = `E2E Stop Error ${suffix}`;
    const taskTitle = `E2E Stop Error Task ${suffix}`;
    let projectId: string | null = null;
    let taskId: string | null = null;

    try {
      const projectRes = await request.post("/api/projects", {
        data: { name: projectName, weight: 5, friction: 5 },
      });
      expect(projectRes.ok()).toBeTruthy();
      const project = (await projectRes.json()) as { id: string };
      projectId = project.id;

      const taskRes = await request.post("/api/tasks", {
        data: { projectId, title: taskTitle, type: "ACTION" },
      });
      expect(taskRes.ok()).toBeTruthy();
      const task = (await taskRes.json()) as { id: string };
      taskId = task.id;

      await page.goto(`/focus/${projectId}/room?taskId=${taskId}`);
      await page
        .getByPlaceholder("Что важно помнить перед следующей сессией...")
        .fill("Нужно продолжить завтра");

      await page.route("**/api/projects/*/status", async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Simulated status error" }),
        });
      });

      let sawNativeDialog = false;
      page.on("dialog", async (dialog) => {
        sawNativeDialog = true;
        await dialog.dismiss();
      });

      await page.getByRole("button", { name: "Остановить и сохранить" }).click();
      const errorDialog = page.getByRole("dialog", { name: "Ошибка остановки сессии" });
      await expect(errorDialog).toBeVisible();
      await expect.poll(() => sawNativeDialog).toBe(false);
      await errorDialog.getByRole("button", { name: "Выйти без сохранения" }).click();
      await expect(page).toHaveURL(new RegExp(`/focus/${projectId}$`));
    } finally {
      if (taskId) {
        await request.delete(`/api/tasks/${taskId}`).catch(() => null);
      }
      if (projectId) {
        await request.delete(`/api/projects/${projectId}`).catch(() => null);
      }
    }
  });
});
