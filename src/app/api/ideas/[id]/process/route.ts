import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { action, targetProjectId, title } = body;

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  let result;

  if (action === "convert_to_task") {
    if (!targetProjectId) {
      return NextResponse.json(
        { error: "Project ID required" },
        { status: 400 },
      );
    }
    result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          projectId: targetProjectId,
          title: title || idea.content,
          type: "ACTION",
        },
      });
      await tx.idea.update({
        where: { id },
        data: { processed: true, projectId: targetProjectId },
      });
      return task;
    });
  } else if (action === "convert_to_project") {
    result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: { name: title || "New Project from Idea" },
      });
      const task = await tx.task.create({
        data: { projectId: project.id, title: idea.content, type: "ACTION" },
      });
      await tx.idea.update({
        where: { id },
        data: { processed: true, projectId: project.id },
      });
      return { project, task };
    });
  }

  return NextResponse.json(result);
}
