import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  parseOptionalBoolean,
  parseOptionalEnumValue,
  parseOptionalString,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            telegramId: true,
          },
        },
        logs: {
          orderBy: { sentAt: "desc" },
          take: 30,
        },
      },
    });

    if (!reminder) {
      return apiError(404, "NOT_FOUND", "Напоминание не найдено");
    }

    return NextResponse.json(reminder);
  } catch (error: unknown) {
    return apiError(500, "INTERNAL_ERROR", "Не удалось получить напоминание");
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = assertRecord(body);

    const text = parseOptionalString(payload.text, "text", 1000);
    const datetime = parseOptionalDate(payload.datetime, "datetime");
    const recurring = parseOptionalEnumValue(payload.recurring, "recurring", ["DAILY", "WEEKLY"]);
    const enabled = parseOptionalBoolean(payload.enabled, "enabled");

    const updateData: any = {};
    if (text !== undefined) updateData.text = text;
    if (datetime !== undefined) updateData.datetime = datetime;
    if (recurring !== undefined) updateData.recurring = recurring;
    if (enabled !== undefined) updateData.enabled = enabled;

    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            telegramId: true,
          },
        },
        logs: {
          orderBy: { sentAt: "desc" },
          take: 10,
        },
      },
    });

    return NextResponse.json(reminder);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return apiError(404, "NOT_FOUND", "Напоминание не найдено");
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось обновить напоминание");
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.reminder.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Record to delete does not exist")) {
      return apiError(404, "NOT_FOUND", "Напоминание не найдено");
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось удалить напоминание");
  }
}

function parseOptionalDate(value: unknown, fieldName: string): Date | undefined {
  if (value === undefined || value === null) return undefined;
  const raw = parseRequiredString(value, fieldName, 1, 64);
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`);
  }
  return date;
}
