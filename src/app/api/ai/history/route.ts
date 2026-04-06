import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRecord,
  apiError,
  ValidationError,
  validationError,
  parseRequiredString,
} from "@/lib/api-validation";

type IncomingMessage = {
  role: "user" | "assistant";
  content: string;
};

function parseMessages(value: unknown): IncomingMessage[] {
  if (!Array.isArray(value)) {
    throw new ValidationError("messages must be an array");
  }

  return value.map((item, index) => {
    const record = assertRecord(item, `messages[${index}] must be an object`);
    const role = parseRequiredString(record.role, `messages[${index}].role`, 1, 20);
    const content = parseRequiredString(record.content, `messages[${index}].content`, 1, 8000);

    if (role !== "user" && role !== "assistant") {
      throw new ValidationError(`messages[${index}].role must be user or assistant`);
    }

    return {
      role,
      content,
    } as IncomingMessage;
  });
}

export async function GET() {
  try {
    const messages = await prisma.$queryRawUnsafe<
      Array<{ id: string; role: string; content: string; createdAt: string }>
    >(
      'SELECT id, role, content, createdAt FROM "AgentChatMessage" ORDER BY createdAt ASC LIMIT 300',
    );

    return NextResponse.json({ messages });
  } catch {
    return apiError(500, "INTERNAL_ERROR", "Не удалось загрузить историю чата");
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = assertRecord(body);
    const messages = parseMessages(payload.messages);

    await prisma.$executeRawUnsafe('DELETE FROM "AgentChatMessage"');

    for (const message of messages) {
      await prisma.$executeRawUnsafe(
        'INSERT INTO "AgentChatMessage" ("id", "role", "content", "createdAt") VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        crypto.randomUUID(),
        message.role,
        message.content,
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ValidationError) {
      return validationError(error.message);
    }
    return apiError(500, "INTERNAL_ERROR", "Не удалось сохранить историю чата");
  }
}

export async function DELETE() {
  try {
    await prisma.$executeRawUnsafe('DELETE FROM "AgentChatMessage"');
    return NextResponse.json({ success: true });
  } catch {
    return apiError(500, "INTERNAL_ERROR", "Не удалось очистить историю чата");
  }
}
