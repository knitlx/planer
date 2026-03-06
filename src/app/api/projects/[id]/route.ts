import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseOptionalEnumValue,
  parseOptionalInt,
  parseOptionalString,
  parseOptionalBoolean,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

function parseOptionalDate(value: unknown, fieldName: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string or null`);
  }
  const normalized = value.trim();
  if (!normalized) return null;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }
  return date;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
  if (!project) {
    return apiError(404, "NOT_FOUND", "Проект не найден");
  }
  return NextResponse.json(project);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = assertRecord(body);
    const name = parseOptionalString(payload.name, "name", 120);
    const description = parseOptionalString(payload.description, "description", 4000);
    const lastSessionNote = parseOptionalString(payload.lastSessionNote, "lastSessionNote", 2000);
    const weight = parseOptionalInt(payload.weight, "weight", 1, 10);
    const friction = parseOptionalInt(payload.friction, "friction", 1, 10);
    const deadline = parseOptionalDate(payload.deadline, "deadline");
    const status = parseOptionalEnumValue(payload.status, "status", [
      "INCUBATOR",
      "ACTIVE",
      "SNOOZED",
      "FINAL_STRETCH",
      "DONE",
    ] as const);
    const type = parseOptionalEnumValue(payload.type, "type", [
      "MANDATORY",
      "NORMAL",
    ] as const);
    const todayCompleted = parseOptionalBoolean(payload.todayCompleted, "todayCompleted");

    if (
      name === undefined &&
      description === undefined &&
      lastSessionNote === undefined &&
      weight === undefined &&
      friction === undefined &&
      deadline === undefined &&
      status === undefined &&
      type === undefined &&
      todayCompleted === undefined
    ) {
      return validationError("Нужно передать хотя бы одно поле для обновления");
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description: description === undefined ? undefined : description || null,
        lastSessionNote:
          lastSessionNote === undefined ? undefined : lastSessionNote || null,
        weight,
        friction,
        deadline,
        status,
        type,
        todayCompleted,
        lastCompletedAt: todayCompleted === true ? new Date() : todayCompleted === false ? null : undefined,
      },
    });
    return NextResponse.json(project);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    if (error?.code === "P2025") {
      return apiError(404, "NOT_FOUND", "Проект не найден");
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось обновить проект");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });

  if (!project) {
    return apiError(404, "NOT_FOUND", "Проект не найден");
  }

  if (project._count.tasks > 0) {
    return apiError(409, "CONFLICT", "Нельзя удалить проект, пока в нем есть задачи");
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
