import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-validation";

function getTranscribeConfig() {
  const apiKey = process.env.AI_TRANSCRIBE_API_KEY || process.env.GROQ_API_KEY;
  const baseUrl = process.env.AI_TRANSCRIBE_API_BASE || "https://api.groq.com/openai/v1";
  const model = process.env.AI_TRANSCRIBE_MODEL || "whisper-large-v3-turbo";

  if (!apiKey) {
    throw new Error("AI_TRANSCRIBE_API_KEY (или GROQ_API_KEY) не задан");
  }

  return { apiKey, baseUrl, model };
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("audio");

    if (!(file instanceof File)) {
      return apiError(400, "VALIDATION_ERROR", "Нужно передать audio файл в multipart/form-data");
    }

    const { apiKey, baseUrl, model } = getTranscribeConfig();

    const upstreamForm = new FormData();
    upstreamForm.append("file", file, file.name || "recording.webm");
    upstreamForm.append("model", model);
    upstreamForm.append("response_format", "json");

    const response = await fetch(`${baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstreamForm,
    });

    if (!response.ok) {
      const payload = await response.text();
      return apiError(500, "INTERNAL_ERROR", `Ошибка транскрибации: ${payload}`);
    }

    const payload = (await response.json()) as { text?: string };
    return NextResponse.json({ text: payload.text || "" });
  } catch (error) {
    return apiError(
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Не удалось распознать голос",
    );
  }
}
