import { NextResponse } from "next/server";
import { TaskService } from "@/services/TaskService";
import {
  assertRecord,
  apiError,
  parseOptionalString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = assertRecord(body);
    const contextSummary = parseOptionalString(payload.contextSummary, "contextSummary", 4000);
    const timerLog = parseOptionalString(payload.timerLog, "timerLog", 4000);

    const result = await TaskService.completeTaskWithProgress(
      id,
      contextSummary,
      timerLog,
    );
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(500, "INTERNAL_ERROR", error instanceof Error ? error.message : "Не удалось завершить задачу");
  }
}
