import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Простая проверка подключения к базе данных
    const count = await prisma.project.count();
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      projectCount: count,
    });
  } catch (error: any) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: error.toString(),
      },
      { status: 500 },
    );
  }
}
