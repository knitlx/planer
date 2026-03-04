import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  parseOptionalEnumValue,
  parseOptionalInt,
  parseOptionalString,
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
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
    ] as const);

    if (
      name === undefined &&
      description === undefined &&
      lastSessionNote === undefined &&
      weight === undefined &&
      friction === undefined &&
      deadline === undefined &&
      status === undefined
    ) {
      return validationError("At least one field is required");
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
      },
    });
    return NextResponse.json(project);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
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
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project._count.tasks > 0) {
    return NextResponse.json(
      {
        error: "Нельзя удалить проект, пока в нем есть задачи",
      },
      { status: 400 },
    );
  }

  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
