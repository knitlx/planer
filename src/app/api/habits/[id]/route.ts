import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseOptionalString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const habit = await prisma.habit.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { date: "desc" },
      },
    },
  });
  if (!habit) {
    return apiError(404, "NOT_FOUND", "Привычка не найдена");
  }
  return NextResponse.json(habit);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = assertRecord(body);
    const name = parseOptionalString(payload.name, "name", 200);
    const description = parseOptionalString(payload.description, "description", 1000);

    if (name === undefined && description === undefined) {
      return validationError("Нужно передать хотя бы одно поле для обновления");
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: {
        name,
        description: description === undefined ? undefined : description || null,
      },
      include: {
        logs: true,
      },
    });
    return NextResponse.json(habit);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    if ((error as { code?: string })?.code === "P2025") {
      return apiError(404, "NOT_FOUND", "Привычка не найдена");
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось обновить привычку");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit) {
    return apiError(404, "NOT_FOUND", "Привычка не найдена");
  }

  await prisma.habit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
