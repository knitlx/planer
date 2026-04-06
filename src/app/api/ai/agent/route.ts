import { NextResponse } from "next/server";
import { runAgentConversation, type AgentMode, type AgentResponseStyle } from "@/lib/ai-agent";
import {
  assertRecord,
  validationError,
  apiError,
  parseRequiredString,
  ValidationError,
} from "@/lib/api-validation";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

function parseMessages(value: unknown): IncomingMessage[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ValidationError("messages must be a non-empty array");
  }

  return value.map((item, index) => {
    const record = assertRecord(item, `messages[${index}] must be an object`);
    const role = parseRequiredString(record.role, `messages[${index}].role`, 1, 20);
    const content = parseRequiredString(record.content, `messages[${index}].content`, 1, 8000);

    if (role !== "user" && role !== "assistant") {
      throw new ValidationError(`messages[${index}].role must be user or assistant`);
    }

    return { role, content } as IncomingMessage;
  });
}

function parseMode(value: unknown): AgentMode {
  if (value === undefined || value === null) return "ASSISTANT";
  if (value === "ASSISTANT" || value === "PLAN" || value === "BUILD") return value;
  throw new ValidationError("mode must be ASSISTANT, PLAN or BUILD");
}

function parseResponseStyle(value: unknown): AgentResponseStyle {
  if (value === undefined || value === null) return "BRIEF";
  if (value === "BRIEF" || value === "DEEP") return value;
  throw new ValidationError("responseStyle must be BRIEF or DEEP");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = assertRecord(body);
    const messages = parseMessages(payload.messages);
    const mode = parseMode(payload.mode);
    const responseStyle = parseResponseStyle(payload.responseStyle);

    const result = await runAgentConversation(messages, mode, responseStyle);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }

    return apiError(
      500,
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "Не удалось выполнить запрос к AI-агенту",
    );
  }
}
