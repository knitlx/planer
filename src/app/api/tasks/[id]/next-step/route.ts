import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      select: { projectId: true },
    });

    if (!task) {
      return apiError(404, "NOT_FOUND", "Задача не найдена");
    }

    await prisma.$transaction([
      prisma.task.updateMany({
        where: { projectId: task.projectId, isNextStep: true },
        data: { isNextStep: false },
      }),
      prisma.task.update({
        where: { id },
        data: { isNextStep: true },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError(500, "INTERNAL_ERROR", "Не удалось обновить next-step");
  }
}
