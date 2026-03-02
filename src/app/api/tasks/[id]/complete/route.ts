import { NextResponse } from "next/server";
import { TaskService } from "@/services/TaskService";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { contextSummary, timerLog } = body;

  try {
    const result = await TaskService.completeTaskWithProgress(
      id,
      contextSummary,
      timerLog,
    );
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
