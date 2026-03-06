import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseOptionalEnumValue,
  parseOptionalInt,
  parseOptionalString,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

function parseOptionalDate(value: unknown, fieldName: string): Date | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = parseOptionalString(value, fieldName, 64);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }
  return date;
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: { tasks: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });

    // Упрощенная версия обогащения проектов
    const enrichedProjects = projects.map((project) => {
      const now = new Date();
      const updated = new Date(project.updatedAt);
      const diffTime = Math.abs(now.getTime() - updated.getTime());
      const daysSinceActive = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Простой расчет score без friction
      let focusScore = project.weight * 10 + project.progress * 0.3;
      if (project.progress >= 70) focusScore += 25;
      if (daysSinceActive >= 3) focusScore -= daysSinceActive * 5;
      focusScore = Math.max(0, focusScore);

      return {
        ...project,
        focusScore: Math.round(focusScore),
        daysStale: daysSinceActive,
      };
    });

    return NextResponse.json(enrichedProjects);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось загрузить проекты");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = assertRecord(body);
    const name = parseRequiredString(payload.name, "name", 1, 120);
    const description = parseOptionalString(payload.description, "description", 4000);
    const weight = parseOptionalInt(payload.weight, "weight", 1, 10) ?? 5;
    const friction = parseOptionalInt(payload.friction, "friction", 1, 10) ?? 5;
    const deadline = parseOptionalDate(payload.deadline, "deadline");
    const status = parseOptionalEnumValue(payload.status, "status", [
      "INCUBATOR",
      "ACTIVE",
      "SNOOZED",
      "FINAL_STRETCH",
      "DONE",
    ] as const);

    const project = await prisma.project.create({
      data: { name, description: description || null, weight, friction, deadline, status },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    console.error("Error creating project:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось создать проект");
  }
}
