import { test, expect } from "@playwright/test";

test.describe("Focus room timer", () => {
  test("updates timer while focus room is open", async ({ page, request }) => {
    const suffix = Date.now().toString();
    const projectName = `E2E Timer ${suffix}`;
    const taskTitle = `E2E Timer Task ${suffix}`;
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

      const timer = page.locator(".font-mono.font-bold.gradient-text").first();
      await expect(timer).toBeVisible();
      const initialValue = (await timer.textContent())?.trim() ?? "";

      await page.waitForTimeout(1400);

      await expect
        .poll(async () => (await timer.textContent())?.trim() ?? "")
        .not.toBe(initialValue);

      await page
        .getByRole("button", { name: "Выйти без сохранения" })
        .evaluate((button) => (button as HTMLButtonElement).click());
      await expect(page).toHaveURL(new RegExp(`/focus/${projectId}$`));

      await expect
        .poll(async () => {
          const response = await request.get(`/api/tasks?projectId=${projectId}`);
          expect(response.ok()).toBeTruthy();
          const tasks = (await response.json()) as Array<{ id: string; timerLog?: string | null }>;
          const task = tasks.find((item) => item.id === taskId);
          return Number(task?.timerLog ?? 0);
        })
        .toBeGreaterThan(0);
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
