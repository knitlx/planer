import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  parseOptionalInt,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: { tasks: true },
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
    return NextResponse.json(
      {
        error: "Failed to fetch projects",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = assertRecord(body);
    const name = parseRequiredString(payload.name, "name", 1, 120);
    const weight = parseOptionalInt(payload.weight, "weight", 1, 10) ?? 5;
    const friction = parseOptionalInt(payload.friction, "friction", 1, 10) ?? 5;

    const project = await prisma.project.create({
      data: { name, weight, friction },
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    console.error("Error creating project:", error);
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
