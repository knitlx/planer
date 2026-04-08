import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseEnumValue,
  parseOptionalString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

const PROJECT_STATUSES = ["INCUBATOR", "ACTIVE", "SNOOZED", "FINAL_STRETCH", "DONE"] as const;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let id: string;
  let status: (typeof PROJECT_STATUSES)[number];
  let lastSessionNote: string | undefined;

  try {
    const resolved = await params;
    id = resolved.id;
    const body = await request.json();
    const payload = assertRecord(body);
    status = parseEnumValue(payload.status, "status", PROJECT_STATUSES);
    lastSessionNote = parseOptionalString(payload.lastSessionNote, "lastSessionNote", 2000);
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(400, "VALIDATION_ERROR", "Некорректное тело запроса");
  }

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return apiError(404, "NOT_FOUND", "Проект не найден");
  }

  if (project.status === "ACTIVE" && status !== "ACTIVE" && !lastSessionNote) {
    return NextResponse.json(
      {
        error: {
          code: "HOOK_REQUIRED",
          message: "Перед остановкой фокуса добавьте заметку о результатах сессии",
        },
      },
      { status: 400 },
    );
  }

  const updated = await prisma.project.update({ where: { id }, data: { status, lastSessionNote } });
  return NextResponse.json(updated);
}
