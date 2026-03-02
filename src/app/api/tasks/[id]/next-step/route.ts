import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
