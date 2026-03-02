const baseUrl = process.env.BASE_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { response, payload };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const createdProjectIds = [];
  const createdTaskIds = [];
  const createdIdeaIds = [];

  try {
    const suffix = Date.now().toString();

    const createProject = await request("/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: `Smoke Project ${suffix}`,
        weight: 7,
        friction: 4,
      }),
    });
    assert(
      createProject.response.status === 201,
      `create project failed: ${createProject.response.status}`,
    );
    const projectId = createProject.payload?.id;
    assert(Boolean(projectId), "project id is missing");
    createdProjectIds.push(projectId);

    const createTask = await request("/api/tasks", {
      method: "POST",
      body: JSON.stringify({
        projectId,
        title: `Smoke Task ${suffix}`,
        type: "ACTION",
      }),
    });
    assert(
      createTask.response.status === 201,
      `create task failed: ${createTask.response.status}`,
    );
    const taskId = createTask.payload?.id;
    assert(Boolean(taskId), "task id is missing");
    createdTaskIds.push(taskId);

    const rejectProjectDelete = await request(`/api/projects/${projectId}`, {
      method: "DELETE",
    });
    assert(
      rejectProjectDelete.response.status === 400,
      "project delete should be rejected when tasks exist",
    );

    const ideaToTask = await request("/api/ideas", {
      method: "POST",
      body: JSON.stringify({
        content: `Idea to task ${suffix}`,
      }),
    });
    assert(
      ideaToTask.response.status === 201,
      `create idea for task failed: ${ideaToTask.response.status}`,
    );
    const ideaToTaskId = ideaToTask.payload?.id;
    assert(Boolean(ideaToTaskId), "ideaToTask id is missing");
    createdIdeaIds.push(ideaToTaskId);

    const convertToTask = await request(`/api/ideas/${ideaToTaskId}/process`, {
      method: "PUT",
      body: JSON.stringify({
        action: "convert_to_task",
        targetProjectId: projectId,
        title: `Converted Task ${suffix}`,
      }),
    });
    assert(
      convertToTask.response.status === 200,
      `convert idea to task failed: ${convertToTask.response.status}`,
    );
    const convertedTaskId = convertToTask.payload?.id;
    assert(Boolean(convertedTaskId), "converted task id is missing");
    createdTaskIds.push(convertedTaskId);

    const ideaToProject = await request("/api/ideas", {
      method: "POST",
      body: JSON.stringify({
        content: `Idea to project ${suffix}`,
      }),
    });
    assert(
      ideaToProject.response.status === 201,
      `create idea for project failed: ${ideaToProject.response.status}`,
    );
    const ideaToProjectId = ideaToProject.payload?.id;
    assert(Boolean(ideaToProjectId), "ideaToProject id is missing");
    createdIdeaIds.push(ideaToProjectId);

    const convertToProject = await request(
      `/api/ideas/${ideaToProjectId}/process`,
      {
        method: "PUT",
        body: JSON.stringify({
          action: "convert_to_project",
          projectName: `Converted Project ${suffix}`,
          title: `Seed task ${suffix}`,
          weight: 6,
        }),
      },
    );
    assert(
      convertToProject.response.status === 200,
      `convert idea to project failed: ${convertToProject.response.status}`,
    );
    const convertedProjectId = convertToProject.payload?.project?.id;
    assert(Boolean(convertedProjectId), "converted project id is missing");
    createdProjectIds.push(convertedProjectId);

    const convertedProjectTasks = await request(
      `/api/tasks?projectId=${convertedProjectId}`,
    );
    assert(
      convertedProjectTasks.response.status === 200,
      "cannot fetch tasks for converted project",
    );
    const seedTaskId = convertedProjectTasks.payload?.[0]?.id;
    if (seedTaskId) {
      createdTaskIds.push(seedTaskId);
    }

    const ideaToArchive = await request("/api/ideas", {
      method: "POST",
      body: JSON.stringify({
        content: `Idea to archive ${suffix}`,
      }),
    });
    assert(
      ideaToArchive.response.status === 201,
      `create idea for archive failed: ${ideaToArchive.response.status}`,
    );
    const ideaToArchiveId = ideaToArchive.payload?.id;
    assert(Boolean(ideaToArchiveId), "ideaToArchive id is missing");
    createdIdeaIds.push(ideaToArchiveId);

    const archiveIdea = await request(`/api/ideas/${ideaToArchiveId}/process`, {
      method: "PUT",
      body: JSON.stringify({
        action: "archive",
      }),
    });
    assert(
      archiveIdea.response.status === 200,
      `archive idea failed: ${archiveIdea.response.status}`,
    );

    const inboxIdeas = await request("/api/ideas?status=INBOX");
    assert(inboxIdeas.response.status === 200, "cannot fetch INBOX ideas");
    assert(
      Array.isArray(inboxIdeas.payload) &&
        !inboxIdeas.payload.some((idea) => idea.id === ideaToArchiveId),
      "archived idea still appears in INBOX",
    );

    const archivedIdeas = await request("/api/ideas?status=ARCHIVED");
    assert(archivedIdeas.response.status === 200, "cannot fetch ARCHIVED ideas");
    assert(
      Array.isArray(archivedIdeas.payload) &&
        archivedIdeas.payload.some((idea) => idea.id === ideaToArchiveId),
      "archived idea is missing in ARCHIVED",
    );

    console.log("Smoke checks passed");
  } finally {
    for (const taskId of createdTaskIds) {
      await request(`/api/tasks/${taskId}`, { method: "DELETE" });
    }
    for (const ideaId of createdIdeaIds) {
      await request(`/api/ideas/${ideaId}`, { method: "DELETE" });
    }
    for (const projectId of createdProjectIds) {
      await request(`/api/projects/${projectId}`, { method: "DELETE" });
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
