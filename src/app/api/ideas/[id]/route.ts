import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api-validation";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await prisma.idea.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return apiError(404, "NOT_FOUND", "Идея не найдена");
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось удалить идею");
  }
}
