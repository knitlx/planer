import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Простой запрос без include
    const count = await prisma.project.count();

    // Попробуем получить проекты без tasks
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        progress: true,
        weight: true,
      },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      projectCount: count,
      projects: projects,
      message: "Prisma is working without tasks include",
    });
  } catch (error: any) {
    console.error("Debug error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    );
  }
}
