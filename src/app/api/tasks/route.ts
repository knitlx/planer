import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseOptionalEnumValue,
  parseOptionalNonNegativeInt,
  parseOptionalString,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

const TASK_TYPES = ["ACTION", "SESSION"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const tasks = await prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { order: "asc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = assertRecord(body);
    const projectId = parseRequiredString(payload.projectId, "projectId", 1, 100);
    const title = parseRequiredString(payload.title, "title", 1, 500);
    const type = parseOptionalEnumValue(payload.type, "type", TASK_TYPES) ?? "ACTION";
    const order = parseOptionalNonNegativeInt(payload.order, "order") ?? 0;
    const contextSummary = parseOptionalString(payload.contextSummary, "contextSummary", 4000);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!project) {
      return apiError(404, "NOT_FOUND", "Проект не найден");
    }

    const task = await prisma.task.create({
      data: { projectId, title, type, order, contextSummary: contextSummary || null },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось создать задачу");
  }
}
