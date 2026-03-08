import { NextResponse } from "next/server";

import { ReminderTriggerType, type Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  apiError,
  assertRecord,
  parseOptionalBoolean,
  parseOptionalInt,
  parseRequiredString,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

const THRESHOLD_MIN_DAYS = 1;
const THRESHOLD_MAX_DAYS = 30;
const COOLDOWN_MIN_HOURS = 1;
const COOLDOWN_MAX_HOURS = 168;

export async function GET() {
  try {
    const configs = await prisma.reminderTriggerConfig.findMany({
      orderBy: { type: "asc" },
    });
    if (configs.length === 0) {
      await prisma.reminderTriggerConfig.createMany({
        data: [
          {
            type: ReminderTriggerType.MANDATORY_STALE,
            thresholdDays: 2,
            cooldownHours: 24,
            enabled: true,
          },
          {
            type: ReminderTriggerType.MANDATORY_IGNORED,
            thresholdDays: 1,
            cooldownHours: 24,
            enabled: true,
          },
          {
            type: ReminderTriggerType.MANDATORY_NO_ACTIVE_TASKS,
            cooldownHours: 24,
            enabled: true,
          },
        ],
      });
      const seeded = await prisma.reminderTriggerConfig.findMany({
        orderBy: { type: "asc" },
      });
      return NextResponse.json(seeded);
    }
    return NextResponse.json(configs);
  } catch (error) {
    console.error("Failed to load reminder trigger configs:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось загрузить конфигурации триггеров");
  }
}

export async function PUT(request: Request) {
  try {
    const payload = assertRecord(await request.json());
    const id = parseRequiredString(payload.id, "id", 1, 64);
    const thresholdDays = parseOptionalInt(
      payload.thresholdDays,
      "thresholdDays",
      THRESHOLD_MIN_DAYS,
      THRESHOLD_MAX_DAYS,
    );
    const cooldownHours = parseOptionalInt(
      payload.cooldownHours,
      "cooldownHours",
      COOLDOWN_MIN_HOURS,
      COOLDOWN_MAX_HOURS,
    );
    const enabled = parseOptionalBoolean(payload.enabled, "enabled");

    if (
      thresholdDays === undefined &&
      cooldownHours === undefined &&
      typeof enabled !== "boolean"
    ) {
      throw new ValidationError("Не указаны поля для обновления");
    }

    const data: Prisma.ReminderTriggerConfigUpdateInput = {};
    if (typeof thresholdDays === "number") {
      data.thresholdDays = thresholdDays;
    }
    if (typeof cooldownHours === "number") {
      data.cooldownHours = cooldownHours;
    }
    if (typeof enabled === "boolean") {
      data.enabled = enabled;
    }

    const result = await prisma.reminderTriggerConfig.update({
      where: { id },
      data,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    console.error("Failed to update reminder trigger config:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось обновить конфигурацию триггера");
  }
}
