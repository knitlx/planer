import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const tasks = await prisma.task.findMany({
    where: projectId ? { projectId } : undefined,
    orderBy: { order: "asc" },
  });
  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { projectId, title, type = "ACTION", order } = body;
  const task = await prisma.task.create({
    data: { projectId, title, type, order: order ?? 0 },
  });
  return NextResponse.json(task, { status: 201 });
}
