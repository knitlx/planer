import { test, expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";

test.describe("Task board editing and moving", () => {
  test("allows renaming a task and performing explicit status transitions", async ({
    page,
    request,
  }) => {
    test.setTimeout(60000);
    const suffix = Date.now().toString();
    const projectName = `E2E Board ${suffix}`;
    const initialTitle = `Task ${suffix}`;
    const renamedTitle = `Task renamed ${suffix}`;
    let projectId: string | null = null;
    let taskId: string | null = null;

    const taskCardByTitle = (currentTitle: string, currentPage: Page) =>
      currentPage
        .getByText(currentTitle, { exact: true })
        .locator("xpath=ancestor::div[contains(@class,'p-3')][1]");
    const setTaskStatus = async (taskCard: Locator, status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED") => {
      await taskCard.getByLabel("Статус задачи").selectOption(status);
    };

    const taskStatusFromApi = async (api: APIRequestContext, currentProjectId: string, currentTaskId: string) => {
      const response = await api.get(`/api/tasks?projectId=${currentProjectId}`);
      expect(response.ok()).toBeTruthy();
      const items = (await response.json()) as Array<{ id: string; status: string }>;
      return items.find((item) => item.id === currentTaskId)?.status;
    };
    const projectProgressFromApi = async (api: APIRequestContext, currentProjectId: string) => {
      const response = await api.get(`/api/projects/${currentProjectId}`);
      expect(response.ok()).toBeTruthy();
      const project = (await response.json()) as { progress: number };
      return project.progress;
    };
    const taskTimerFromApi = async (api: APIRequestContext, currentProjectId: string, currentTaskId: string) => {
      const response = await api.get(`/api/tasks?projectId=${currentProjectId}`);
      expect(response.ok()).toBeTruthy();
      const items = (await response.json()) as Array<{ id: string; timerLog?: string | null }>;
      const taskItem = items.find((item) => item.id === currentTaskId);
      return Number(taskItem?.timerLog ?? 0);
    };

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
          title: initialTitle,
          type: "ACTION",
        },
      });
      expect(taskRes.ok()).toBeTruthy();
      const task = (await taskRes.json()) as { id: string };
      taskId = task.id;

      await page.goto(`/focus/${projectId}`);
      await expect(page.getByText(initialTitle)).toBeVisible();

      const initialCard = taskCardByTitle(initialTitle, page);
      await initialCard.locator('button[aria-label="Редактировать"]').click();

      const editInput = page.locator(`input[value="${initialTitle}"]`).first();
      await expect(editInput).toBeVisible();
      await expect(editInput).toBeEditable();
      await editInput.fill(renamedTitle);
      await page.getByRole("button", { name: "Сохранить" }).first().click();

      await expect(page.getByRole("button", { name: "Сохранить" })).toHaveCount(0);
      await expect(page.getByText(renamedTitle)).toBeVisible();

      const timerCard = taskCardByTitle(renamedTitle, page);
      await timerCard.getByRole("button", { name: "Редактировать время" }).click();
      const timerInput = timerCard.getByLabel("Время задачи");
      await expect(timerInput).toBeVisible();
      await timerInput.fill("00:12:34");
      await timerCard.getByRole("button", { name: "Сохранить время" }).click();
      await expect(timerCard.getByText("Время: 00:12:34")).toBeVisible();
      await expect
        .poll(async () => taskTimerFromApi(request, projectId!, taskId!))
        .toBe(754000);

      await expect
        .poll(async () => taskStatusFromApi(request, projectId!, taskId!))
        .toBe("TODO");
      await expect
        .poll(async () => projectProgressFromApi(request, projectId!))
        .toBe(0);

      const renamedCard = taskCardByTitle(renamedTitle, page);
      await setTaskStatus(renamedCard, "IN_PROGRESS");

      await expect
        .poll(async () => taskStatusFromApi(request, projectId!, taskId!))
        .toBe("IN_PROGRESS");
      await expect
        .poll(async () => projectProgressFromApi(request, projectId!))
        .toBe(0);

      const inProgressCard = taskCardByTitle(renamedTitle, page);
      await setTaskStatus(inProgressCard, "DONE");

      await expect
        .poll(async () => taskStatusFromApi(request, projectId!, taskId!))
        .toBe("DONE");
      await expect
        .poll(async () => projectProgressFromApi(request, projectId!))
        .toBe(100);

      const doneCard = taskCardByTitle(renamedTitle, page);
      await setTaskStatus(doneCard, "IN_PROGRESS");

      await expect
        .poll(async () => taskStatusFromApi(request, projectId!, taskId!))
        .toBe("IN_PROGRESS");
      await expect
        .poll(async () => projectProgressFromApi(request, projectId!))
        .toBe(0);

      const inProgressToTodoCard = taskCardByTitle(renamedTitle, page);
      await setTaskStatus(inProgressToTodoCard, "TODO");

      await expect
        .poll(async () => taskStatusFromApi(request, projectId!, taskId!))
        .toBe("TODO");
      await expect
        .poll(async () => projectProgressFromApi(request, projectId!))
        .toBe(0);

      const finalCard = taskCardByTitle(renamedTitle, page);
      const deleteButton = finalCard.getByRole("button", { name: "Удалить" });
      await expect(deleteButton).toBeVisible();
      await deleteButton.click();

      await expect(page.getByText(renamedTitle, { exact: true })).toHaveCount(0);
      await expect
        .poll(async () => {
          const response = await request.get(`/api/tasks?projectId=${projectId!}`);
          expect(response.ok()).toBeTruthy();
          const items = (await response.json()) as Array<{ id: string }>;
          return items.some((item) => item.id === taskId!);
        })
        .toBe(false);
      taskId = null;
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
