import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WIP_LIMIT = 3;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const { status, lastSessionNote } = body;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (status === "ACTIVE" && project.status !== "ACTIVE") {
    const activeCount = await prisma.project.count({
      where: { status: "ACTIVE", id: { not: id } },
    });
    if (activeCount >= WIP_LIMIT) {
      const activeProjects = await prisma.project.findMany({
        where: { status: "ACTIVE", id: { not: id } },
        select: { id: true, name: true },
      });
      return NextResponse.json(
        {
          error: "WIP_LIMIT_EXCEEDED",
          message: `Cannot activate more than ${WIP_LIMIT} projects`,
          activeProjects,
        },
        { status: 409 },
      );
    }
  }

  if (project.status === "ACTIVE" && status !== "ACTIVE" && !lastSessionNote) {
    return NextResponse.json(
      {
        error: "HOOK_REQUIRED",
        message: "Please provide a session note before stopping focus",
      },
      { status: 400 },
    );
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { status, lastSessionNote },
  });
  return NextResponse.json(updated);
}
