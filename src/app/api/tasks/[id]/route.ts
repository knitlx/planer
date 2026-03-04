import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskService } from "@/services/TaskService";
import {
  assertRecord,
  parseOptionalEnumValue,
  parseOptionalNonNegativeInt,
  parseOptionalString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

const TASK_TYPES = ["ACTION", "SESSION"] as const;
const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] as const;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = assertRecord(body);
    const title = parseOptionalString(payload.title, "title", 500);
    const contextSummary = parseOptionalString(payload.contextSummary, "contextSummary", 4000);
    const timerLog = parseOptionalString(payload.timerLog, "timerLog", 64);
    const type = parseOptionalEnumValue(payload.type, "type", TASK_TYPES);
    const status = parseOptionalEnumValue(payload.status, "status", TASK_STATUSES);
    const order = parseOptionalNonNegativeInt(payload.order, "order");

    if (
      title === undefined &&
      contextSummary === undefined &&
      timerLog === undefined &&
      type === undefined &&
      status === undefined &&
      order === undefined
    ) {
      return validationError("At least one field is required");
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        title,
        contextSummary: contextSummary === undefined ? undefined : contextSummary || null,
        timerLog: timerLog === undefined ? undefined : timerLog || null,
        type,
        status,
        order,
      },
    });

    if (status !== undefined) {
      const progress = await TaskService.calculateProjectProgress(task.projectId);
      await prisma.project.update({
        where: { id: task.projectId },
        data: { progress, updatedAt: new Date() },
      });
    }

    return NextResponse.json(task);
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
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

  try {
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
