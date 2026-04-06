import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  ValidationError,
  validationError,
} from "@/lib/api-validation";

function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateStreak(logs: { date: string; completed: boolean }[]): { current: number; best: number } {
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let previousDate: Date | null = null;

  for (const log of sortedLogs) {
    if (!log.completed) {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 0;
      previousDate = null;
      continue;
    }

    const logDate = new Date(log.date);
    
    if (!previousDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (logDate.getTime() >= yesterday.getTime()) {
        currentStreak = 1;
      }
      tempStreak = 1;
    } else {
      const diff = (previousDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        tempStreak++;
        if (currentStreak > 0) currentStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
        currentStreak = 0;
      }
    }
    
    previousDate = logDate;
  }
  
  bestStreak = Math.max(bestStreak, tempStreak);

  return { current: currentStreak, best: bestStreak };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    let payload: Record<string, unknown> = {};
    try {
      const body = await request.json();
      payload = assertRecord(body);
    } catch {
      payload = {};
    }
    
    const dateValue = typeof payload.date === "string" ? payload.date : "";
    const date = dateValue.trim() || getTodayDate();

    const habit = await prisma.habit.findUnique({
      where: { id },
      include: { logs: { orderBy: { date: "desc" } } },
    });

    if (!habit) {
      return apiError(404, "NOT_FOUND", "Привычка не найдена");
    }

    const existingLog = habit.logs.find(
      (log: { id: string; date: string; completed: boolean }) => log.date === date,
    );
    const newCompletedState = !existingLog?.completed;

    if (existingLog) {
      await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed: newCompletedState },
      });
    } else {
      await prisma.habitLog.create({
        data: {
          habitId: id,
          date,
          completed: newCompletedState,
        },
      });
    }

    const updatedHabit = await prisma.habit.findUnique({
      where: { id },
      include: { logs: { orderBy: { date: "desc" } } },
    });

    if (!updatedHabit) {
      return apiError(500, "INTERNAL_ERROR", "Не удалось обновить привычку");
    }

    const { current, best } = calculateStreak(updatedHabit.logs);

    await prisma.habit.update({
      where: { id },
      data: {
        currentStreak: current,
        bestStreak: best,
      },
    });

    const finalHabit = await prisma.habit.findUnique({
      where: { id },
      include: { logs: { orderBy: { date: "desc" }, take: 30 } },
    });

    return NextResponse.json(finalHabit);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    console.error("Toggle habit error:", error);
    return apiError(500, "INTERNAL_ERROR", "Не удалось переключить привычку");
  }
}
