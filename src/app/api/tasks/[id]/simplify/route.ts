import { NextResponse } from "next/server";
import { TaskService } from "@/services/TaskService";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const tasks = await TaskService.simplifyTask(id);
    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
