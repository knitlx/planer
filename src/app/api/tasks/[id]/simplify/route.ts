import { NextResponse } from "next/server";
import { TaskService } from "@/services/TaskService";
import { apiError } from "@/lib/api-validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const tasks = await TaskService.simplifyTask(id);
    return NextResponse.json(tasks);
  } catch (error) {
    return apiError(500, "INTERNAL_ERROR", error instanceof Error ? error.message : "Не удалось упростить задачу");
  }
}
