import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseOptionalString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

export async function GET() {
  const habits = await prisma.habit.findMany({
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 30,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(habits);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = assertRecord(body);
    const name = parseRequiredString(payload.name, "name", 1, 200);
    const description = parseOptionalString(payload.description, "description", 1000);
    const projectId = parseOptionalString(payload.projectId, "projectId");

    const habit = await prisma.habit.create({
      data: {
        name,
        description: description || null,
        projectId: projectId || null,
      },
      include: {
        logs: true,
      },
    });
    return NextResponse.json(habit, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось создать привычку");
  }
}

function parseRequiredString(
  value: unknown,
  fieldName: string,
  minLength = 1,
  maxLength = 500,
) {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string`);
  }
  const normalized = value.trim();
  if (normalized.length < minLength) {
    throw new ValidationError(`${fieldName} is required`);
  }
  if (normalized.length > maxLength) {
    throw new ValidationError(`${fieldName} is too long`);
  }
  return normalized;
}
