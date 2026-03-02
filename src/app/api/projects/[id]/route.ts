import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  parseOptionalInt,
  parseOptionalString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { tasks: true },
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
    const weight = parseOptionalInt(payload.weight, "weight", 1, 10);
    const friction = parseOptionalInt(payload.friction, "friction", 1, 10);

    if (name === undefined && weight === undefined && friction === undefined) {
      return validationError("At least one field is required");
    }

    const project = await prisma.project.update({
      where: { id },
      data: { name, weight, friction },
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
