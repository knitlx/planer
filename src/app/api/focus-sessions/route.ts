import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseOptionalString,
  parseEnumValue,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

export async function POST(request: Request) {
  let projectId: string;
  let durationSec: number;
  let taskId: string | undefined;
  let startedAt: string | undefined;
  let note: string | undefined;

  try {
    const body = await request.json();
    const payload = assertRecord(body);
    projectId = typeof payload.projectId === "string" ? payload.projectId : "";
    durationSec = typeof payload.durationSec === "number" ? payload.durationSec : 0;
    taskId = parseOptionalString(payload.taskId, "taskId", 100);
    startedAt = parseOptionalString(payload.startedAt, "startedAt", 50);
    note = parseOptionalString(payload.note, "note", 4000);
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(400, "VALIDATION_ERROR", "Некорректное тело запроса");
  }

  if (!projectId || durationSec <= 0) {
    return apiError(400, "VALIDATION_ERROR", "projectId и durationSec обязательны");
  }

  try {
    const session = await prisma.focusSession.create({
      data: {
        projectId,
        taskId: taskId || null,
        durationSec,
        startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - durationSec * 1000),
        endedAt: new Date(),
        note: note || null,
      },
    });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    return apiError(500, "INTERNAL_ERROR", "Не удалось сохранить сессию");
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const days = parseInt(searchParams.get("days") || "7");

  const where: Record<string, unknown> = {
    startedAt: {
      gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    },
  };
  if (projectId) {
    where.projectId = projectId;
  }

  try {
    const sessions = await prisma.focusSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      include: { project: { select: { name: true } } },
    });
    return NextResponse.json(sessions);
  } catch (error) {
    return apiError(500, "INTERNAL_ERROR", "Не удалось загрузить сессии");
  }
}
