import { test, expect } from "@playwright/test";

test.describe("Focus room dialog behavior", () => {
  test("does not trigger native browser dialogs during timer validation", async ({ page, request }) => {
    const suffix = Date.now().toString();
    const projectName = `E2E Focus Dialog ${suffix}`;
    const taskTitle = `Task ${suffix}`;
    let projectId: string | null = null;
    let taskId: string | null = null;
    let sawNativeDialog = false;

    page.on("dialog", async (dialog) => {
      sawNativeDialog = true;
      await dialog.dismiss();
    });

    try {
      const projectRes = await request.post("/api/projects", {
        data: { name: projectName, weight: 5, friction: 5 },
      });
      expect(projectRes.ok()).toBeTruthy();
      const project = (await projectRes.json()) as { id: string };
      projectId = project.id;

      const taskRes = await request.post("/api/tasks", {
        data: {
          projectId,
          title: taskTitle,
          type: "ACTION",
        },
      });
      expect(taskRes.ok()).toBeTruthy();
      const task = (await taskRes.json()) as { id: string };
      taskId = task.id;

      await page.goto(`/focus/${projectId}/room?taskId=${taskId}`);
      await expect(page.getByRole("heading", { name: projectName })).toBeVisible();

      const sessionNoteInput = page.getByPlaceholder(
        "Что важно помнить перед следующей сессией...",
      );
      await sessionNoteInput.fill("");
      await page.getByRole("button", { name: "Остановить и сохранить" }).click();

      await expect.poll(() => sawNativeDialog).toBe(false);
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
