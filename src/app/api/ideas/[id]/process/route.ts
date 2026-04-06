import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseEnumValue,
  parseOptionalInt,
  parseOptionalString,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

const IDEA_ACTIONS = ["convert_to_task", "convert_to_project", "archive"] as const;
const IDEA_CONVERSION_TITLE_MAX_LENGTH = 2000;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let id: string;
  let action: (typeof IDEA_ACTIONS)[number];
  let targetProjectId: string | undefined;
  let title: string | undefined;
  let projectName: string | undefined;
  let weight: number | undefined;

  try {
    const resolved = await params;
    id = resolved.id;
    const body = await request.json();
    const payload = assertRecord(body);
    action = parseEnumValue(payload.action, "action", IDEA_ACTIONS);
    targetProjectId = parseOptionalString(payload.targetProjectId, "targetProjectId", 100);
    title = parseOptionalString(payload.title, "title", IDEA_CONVERSION_TITLE_MAX_LENGTH);
    projectName = parseOptionalString(payload.projectName, "projectName", 120);
    weight = parseOptionalInt(payload.weight, "weight", 1, 10);
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(400, "VALIDATION_ERROR", "Некорректное тело запроса");
  }

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    return apiError(404, "NOT_FOUND", "Идея не найдена");
  }

  if (idea.status !== "INBOX") {
    return apiError(409, "CONFLICT", "Идея уже обработана");
  }

  if (action === "archive") {
    const archivedIdea = await prisma.idea.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        processed: true,
      },
    });

    return NextResponse.json(archivedIdea);
  }

  if (action === "convert_to_task") {
    if (!title) return validationError("Поле title обязательно");
    if (!targetProjectId) return validationError("Поле targetProjectId обязательно");

    const project = await prisma.project.findUnique({
      where: { id: targetProjectId },
      select: { id: true },
    });

    if (!project) {
      return apiError(404, "NOT_FOUND", "Проект не найден");
    }

    const task = await prisma.$transaction(async (tx: any) => {
      const task = await tx.task.create({
        data: {
          projectId: targetProjectId,
          title,
          type: "ACTION",
        },
      });
      await tx.idea.update({
        where: { id },
        data: {
          processed: true,
          projectId: targetProjectId,
          status: "CONVERTED_TO_TASK",
          convertedEntityType: "TASK",
          convertedEntityId: task.id,
        },
      });
      return task;
    });

    return NextResponse.json(task);
  }

  if (!projectName) return validationError("Поле projectName обязательно");
  const projectWeight = weight ?? 5;

  const result = await prisma.$transaction(async (tx: any) => {
    const project = await tx.project.create({
      data: { name: projectName, weight: projectWeight },
    });

    if (title) {
      await tx.task.create({
        data: { projectId: project.id, title, type: "ACTION" },
      });
    }

    await tx.idea.update({
      where: { id },
      data: {
        processed: true,
        projectId: project.id,
        status: "CONVERTED_TO_PROJECT",
        convertedEntityType: "PROJECT",
        convertedEntityId: project.id,
      },
    });

    return { project };
  });

  return NextResponse.json(result);
}
