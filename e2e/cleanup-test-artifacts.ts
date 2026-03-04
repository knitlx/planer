import type { APIRequestContext } from "@playwright/test";

const TEST_PREFIX = "E2E ";

type Project = { id: string; name: string };
type Task = { id: string; title: string };

export async function cleanupTestArtifacts(request: APIRequestContext): Promise<void> {
  const projectsResponse = await request.get("/api/projects");
  if (!projectsResponse.ok()) return;

  const projects = (await projectsResponse.json()) as Project[];
  const testProjects = projects.filter((project) => project.name.startsWith(TEST_PREFIX));

  for (const project of testProjects) {
    const tasksResponse = await request.get(`/api/tasks?projectId=${project.id}`);
    if (tasksResponse.ok()) {
      const tasks = (await tasksResponse.json()) as Task[];
      for (const task of tasks) {
        await request.delete(`/api/tasks/${task.id}`).catch(() => null);
      }
    }
    await request.delete(`/api/projects/${project.id}`).catch(() => null);
  }

  // Safety net for orphan test tasks that are not attached to deleted projects.
  const allTasksResponse = await request.get("/api/tasks");
  if (!allTasksResponse.ok()) return;
  const allTasks = (await allTasksResponse.json()) as Task[];
  const orphanTestTasks = allTasks.filter((task) => task.title.startsWith(TEST_PREFIX));
  for (const task of orphanTestTasks) {
    await request.delete(`/api/tasks/${task.id}`).catch(() => null);
  }
}
