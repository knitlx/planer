import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseEnumValue,
  parseOptionalString,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

const IDEA_STATUSES = [
  "INBOX",
  "CONVERTED_TO_TASK",
  "CONVERTED_TO_PROJECT",
  "ARCHIVED",
] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status");

  let status: (typeof IDEA_STATUSES)[number] | undefined;
  if (statusParam && statusParam !== "ALL") {
    try {
      status = parseEnumValue(statusParam, "status", IDEA_STATUSES);
    } catch (error) {
      if (error instanceof ValidationError) {
        return validationError(error.message);
      }
    }
  }

  const ideas = await prisma.idea.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(ideas);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = assertRecord(body);
    const content = parseRequiredString(payload.content, "content", 1, 2000);
    const source = parseOptionalString(payload.source, "source", 120) ?? "Web";
    const projectId = parseOptionalString(payload.projectId, "projectId", 100);

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true },
      });

      if (!project) {
        return apiError(404, "NOT_FOUND", "Проект не найден");
      }
    }

    const idea = await prisma.idea.create({
      data: { content, source, projectId, status: "INBOX", processed: false },
    });
    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось создать идею");
  }
}
