import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ideas = await prisma.idea.findMany({
    where: { processed: false },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(ideas);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { content, source = "Web", projectId } = body;
  const idea = await prisma.idea.create({
    data: { content, source, projectId },
  });
  return NextResponse.json(idea, { status: 201 });
}
