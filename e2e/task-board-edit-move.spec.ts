import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

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

    const taskStatusFromApi = async (api: APIRequestContext, currentProjectId: string, currentTaskId: string) => {
      const response = await api.get(`/api/tasks?projectId=${currentProjectId}`);
      expect(response.ok()).toBeTruthy();
      const items = (await response.json()) as Array<{ id: string; status: string }>;
      return items.find((item) => item.id === currentTaskId)?.status;
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

      await expect
        .poll(async () => taskStatusFromApi(request, projectId!, taskId!))
        .toBe("TODO");

      const renamedCard = taskCardByTitle(renamedTitle, page);
      await renamedCard.getByRole("button", { name: "В процессе" }).click();

      await expect
        .poll(async () => taskStatusFromApi(request, projectId!, taskId!))
        .toBe("IN_PROGRESS");

      const inProgressCard = taskCardByTitle(renamedTitle, page);
      await inProgressCard.getByRole("button", { name: "Done" }).click();

      await expect
        .poll(async () => taskStatusFromApi(request, projectId!, taskId!))
        .toBe("DONE");

      const doneCard = taskCardByTitle(renamedTitle, page);
      const doneToInProgress = doneCard.getByRole("button", { name: "В процессе" });
      await expect(doneToInProgress).toBeVisible();
      await doneToInProgress.click();

      await expect
        .poll(async () => taskStatusFromApi(request, projectId!, taskId!))
        .toBe("IN_PROGRESS");

      const inProgressToTodoCard = taskCardByTitle(renamedTitle, page);
      const toTodoButton = inProgressToTodoCard.getByRole("button", { name: "В TODO" });
      await expect(toTodoButton).toBeVisible();
      await toTodoButton.click();

      await expect
        .poll(async () => taskStatusFromApi(request, projectId!, taskId!))
        .toBe("TODO");
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
