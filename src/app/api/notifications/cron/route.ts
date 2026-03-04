import { NextResponse } from "next/server";
import { NotificationService } from "@/services/NotificationService";
import { apiError } from "@/lib/api-validation";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError(401, "UNAUTHORIZED", "Не авторизовано");
  }

  await NotificationService.processAll();
  return NextResponse.json({ success: true });
}
