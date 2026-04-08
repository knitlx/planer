import { AGENT_TOOL_DEFINITIONS, executeAgentTool, type AgentToolName } from "@/lib/agent-actions";

export type UserFacingMessage = {
  role: "user" | "assistant";
  content: string;
};
export type AgentMode = "ASSISTANT" | "PLAN" | "BUILD";
export type AgentResponseStyle = "BRIEF" | "DEEP";

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content?: string | null; tool_calls?: unknown[] }
  | { role: "tool"; tool_call_id: string; content: string };

const BASE_SYSTEM_PROMPT = [
  "Ты AI-агент внутри системы Planer. Пользователь — Александра, системный специалист по автоматизации и AI.",
  "Она работает через AI-driven development: формулирует задачи, направляет AI, доводит до production.",
  "Стек: Next.js, TypeScript, n8n, Supabase, Telegram-боты. Не классический программист — код создает через AI-инструменты.",
  "",
  "Твоя задача: помогать управлять проектами, задачами, привычками и идеями через tools.",
  "Всегда используй tools для чтения и изменения данных. Не придумывай ID, не предполагай структуру — проверяй через tools.",
  "",
  "## Правила общения",
  "Пиши кратко и по делу: по умолчанию 3-6 коротких пунктов или 1-2 абзаца.",
  "Тон: спокойный, рабочий, прямой. Без восторгов, эмодзи, декоративных заголовков, «вау», «круто».",
  "Формулировки должны подходить для ТЗ или документации.",
  "Если запрос неясен — задай один короткий уточняющий вопрос, не додумывай.",
  "",
  "## Правила действий",
  "Если просят совет — дай один лучший вариант и конкретный следующий шаг. Альтернативы — только если явно просят.",
  "Для больших списков делай сжатие: максимум 5 пунктов, остальное предлагай показать по запросу.",
  "Перед удалением объектов всегда указывай что именно будет удалено (тип, название, ID) и спрашивай подтверждение.",
  "В конце сообщения добавь метку в формате: <!--DELETE_REQUEST:tool_name=id--> (например: <!--DELETE_REQUEST:delete_task=abc123-->)",
  "Эта метка техническая, пользователь её не видит — UI использует для показа кнопки подтверждения.",
  "Основной текст: 'Удалить <тип> <название> (ID: <id>)? Это действие необратимо.'",
  "После выполнения изменений перечисляй, что именно было изменено.",
  "",
  "## Работа с ошибками",
  "Если tool вернул ошибку — не игнорируй. Сообщи пользователю, что произошло, и предложи вариант: повторить, изменить запрос или обойти проблему.",
  "Не пытайся silently fallback. Лучше честный ответ о неудаче, чем ложное успешное выполнение.",
  "",
  "## Проактивность",
  "Если при анализе задач видишь просроченные, без дедлайна или дубли — упомяни коротко: что найдено и что можно сделать.",
  "Если видишь паттерны (например, много задач без приоритета) — предложи навести порядок, но не навязывай.",
  "",
  "## Decomposition сложных запросов",
  "Если запрос комплексный (например, «создай проект с 5 задачами и настрой привычки»):",
  "1. Кратко перечисли шаги (2-4 пункта).",
  "2. Спроси, ок ли структура.",
  "3. После согласия — выполняй по шагам через tools.",
  "4. По итогу — что создано/изменено.",
  "",
  "Отвечай на русском языке.",
].join(" ");

const MUTATION_TOOLS = new Set<AgentToolName>([
  "create_project",
  "update_project",
  "delete_project",
  "create_task",
  "update_task",
  "delete_task",
  "create_habit",
  "update_habit",
  "set_habit_completion",
  "create_idea",
  "update_idea_status",
]);

function getModePrompt(mode: AgentMode): string {
  if (mode === "ASSISTANT") {
    return [
      "Режим: ASSISTANT (обычный исполнитель).",
      "Выполняй только прямой запрос пользователя без избыточной инициативы.",
      "Если запрос неясен, задай один короткий уточняющий вопрос.",
      "Не предлагай большой план, если пользователь его явно не просил.",
      "Для простых действий (создать задачу, показать проект) — делай сразу.",
    ].join(" ");
  }

  if (mode === "PLAN") {
    return [
      "Режим: PLAN (советник без изменений).",
      "Ты можешь анализировать данные через read-only tools, задавать уточнения, предлагать структуру и приоритеты.",
      "Нельзя вносить изменения в данные пользователя — никаких create/update/delete.",
      "Анализируй текущие задачи/проекты, находи паттерны, пробелы, дубли.",
      "Если нужно применить изменения, сначала предложи план действий (3-5 шагов) и попроси переключиться в BUILD.",
      "Для каждого шага укажи: что делается, какой tool будет вызван, что ожидается на выходе.",
    ].join(" ");
  }

  return [
    "Режим: BUILD (советник + применение).",
    "Для комплексных запросов (2+ изменений) — кратко предложи план шагов, затем выполняй через tools после согласия.",
    "Для простых действий (одна задача, один проект) — делай сразу.",
    "Для destructive действий (удаление, массовое обновление) всегда требуй explicit confirmation с перечислением что затронет.",
    "После каждого batch-операции — итог: что создано/обновлено/удалено.",
  ].join(" ");
}

function getResponseStylePrompt(style: AgentResponseStyle): string {
  if (style === "DEEP") {
    return [
      "Стиль ответа: DEEP (подробный).",
      "Можно рассуждать глубже, но сохраняй структуру и практичность.",
      "Давай контекст, аргументацию и пошаговые рекомендации без воды.",
      "Используй структуру: проблема → анализ → варианты → рекомендация → следующий шаг.",
      "Для планов — нумеруй шаги, указывай зависимости между ними.",
    ].join(" ");
  }

  return [
    "Стиль ответа: BRIEF (краткий).",
    "Отвечай максимально сжато и прикладно.",
    "По умолчанию давай короткий ответ без длинных рассуждений.",
    "Факт → действие. Без вводных вроде «хороший вопрос», «давайте разберём».",
  ].join(" ");
}

function getToolName(definition: unknown): string | null {
  if (!definition || typeof definition !== "object") return null;
  const fn = (definition as { function?: { name?: string } }).function;
  return typeof fn?.name === "string" ? fn.name : null;
}

function getToolDefinitionsForMode(mode: AgentMode) {
  if (mode === "BUILD" || mode === "ASSISTANT") return AGENT_TOOL_DEFINITIONS;

  return AGENT_TOOL_DEFINITIONS.filter((toolDef) => {
    const name = getToolName(toolDef) as AgentToolName | null;
    if (!name) return false;
    return !MUTATION_TOOLS.has(name);
  });
}

const CONTEXT_WINDOW_MESSAGES = 10;
const SUMMARY_BATCH_SIZE = 5;
const SUMMARY_MAX_CONTENT_CHARS = 220;
const MAX_SUMMARY_LINES = 12;

function trimForSummary(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= SUMMARY_MAX_CONTENT_CHARS) return normalized;
  return `${normalized.slice(0, SUMMARY_MAX_CONTENT_CHARS)}...`;
}

function splitIntoChunks<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function buildHistorySummary(olderMessages: UserFacingMessage[]): string {
  if (!olderMessages.length) return "";

  const chunks = splitIntoChunks(olderMessages, SUMMARY_BATCH_SIZE);
  const lines = chunks
    .map((chunk, chunkIndex) => {
      const start = chunkIndex * SUMMARY_BATCH_SIZE + 1;
      const end = start + chunk.length - 1;
      const compact = chunk
        .map((message) => {
          const role = message.role === "user" ? "U" : "A";
          return `${role}: ${trimForSummary(message.content)}`;
        })
        .join(" | ");

      return `Пакет ${start}-${end}: ${compact}`;
    })
    .slice(-MAX_SUMMARY_LINES);

  return [
    `Сжатый контекст ранней части диалога (всего сообщений: ${olderMessages.length}).`,
    ...lines,
  ].join("\n");
}

function extractEntityIds(messages: UserFacingMessage[]): string[] {
  const idRegex = /\b[a-z0-9]{10,30}\b/g;
  const ids = new Set<string>();
  for (const message of messages) {
    const matches = message.content.match(idRegex) || [];
    for (const match of matches) ids.add(match);
  }
  return Array.from(ids).slice(-8);
}

function buildOperationalMemory(inputMessages: UserFacingMessage[]): string {
  if (!inputMessages.length) return "";

  const recent = inputMessages.slice(-20);
  const lastUser = getLastUserMessageContent(inputMessages);
  const ids = extractEntityIds(recent);
  const deleteConfirm = recent
    .slice()
    .reverse()
    .find((message) => /CONFIRM_DELETE\s+(delete_task|delete_project)\s+/i.test(message.content));

  const lines = [
    "Оперативная память (для быстрых ссылок и continuity):",
    `- Последний интент пользователя: ${trimForSummary(lastUser || "не найден")}`,
    `- Недавно встречавшиеся ID: ${ids.length ? ids.join(", ") : "нет"}`,
    `- Последняя команда подтверждения удаления: ${deleteConfirm ? trimForSummary(deleteConfirm.content) : "нет"}`,
  ];

  return lines.join("\n");
}

export function buildContextForModel(
  inputMessages: UserFacingMessage[],
  mode: AgentMode,
  style: AgentResponseStyle,
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: "system", content: BASE_SYSTEM_PROMPT },
    { role: "system", content: getModePrompt(mode) },
    { role: "system", content: getResponseStylePrompt(style) },
  ];
  const olderCount = Math.max(0, inputMessages.length - CONTEXT_WINDOW_MESSAGES);
  const olderMessages = olderCount > 0 ? inputMessages.slice(0, olderCount) : [];
  const recentMessages = olderCount > 0 ? inputMessages.slice(-CONTEXT_WINDOW_MESSAGES) : inputMessages;

  const summary = buildHistorySummary(olderMessages);
  if (summary) {
    messages.push({
      role: "system",
      content:
        `${summary}\nИспользуй это как вспомогательную память, а детали бери из последних сообщений и tools.`,
    });
  }
  messages.push({
    role: "system",
    content: buildOperationalMemory(inputMessages),
  });

  for (const message of recentMessages) {
    if (message.role === "user") {
      messages.push({ role: "user", content: message.content });
      continue;
    }
    messages.push({ role: "assistant", content: message.content });
  }

  return messages;
}

function getLastUserMessageContent(inputMessages: UserFacingMessage[]): string {
  for (let i = inputMessages.length - 1; i >= 0; i -= 1) {
    if (inputMessages[i].role === "user") {
      return inputMessages[i].content;
    }
  }
  return "";
}

export function isDeleteToolCallConfirmed(
  toolName: AgentToolName,
  args: Record<string, unknown>,
  lastUserMessage: string,
) {
  if (toolName !== "delete_task" && toolName !== "delete_project") return true;
  const id = typeof args.id === "string" ? args.id.trim() : "";
  if (!id) return false;

  // Новый формат: <!--DELETE_REQUEST:delete_task=abc123-->
  const htmlPattern = new RegExp(`<!--DELETE_REQUEST:${toolName}=${id}-->`, "i");
  if (htmlPattern.test(lastUserMessage)) return true;

  // Старый формат (fallback): CONFIRM_DELETE delete_task abc123
  const expected = `CONFIRM_DELETE ${toolName} ${id}`;
  return lastUserMessage.trim().toLowerCase() === expected.toLowerCase();
}

function parseJsonArguments(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function getAgentConfig() {
  const apiKey = process.env.AI_AGENT_API_KEY || process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.AI_AGENT_API_BASE || "https://api.deepseek.com/v1";
  const model = process.env.AI_AGENT_MODEL || "deepseek-chat";

  if (!apiKey) {
    throw new Error("AI_AGENT_API_KEY (или DEEPSEEK_API_KEY) не задан");
  }

  return { apiKey, baseUrl, model };
}

async function callModel(messages: ChatMessage[], mode: AgentMode) {
  const { apiKey, baseUrl, model } = getAgentConfig();
  const tools = getToolDefinitionsForMode(mode);

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages,
      tools,
      tool_choice: "auto",
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`LLM request failed (${response.status}): ${payload}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
        tool_calls?: Array<{
          id?: string;
          type?: string;
          function?: {
            name?: string;
            arguments?: string;
          };
        }>;
      };
    }>;
  };

  const message = payload.choices?.[0]?.message;
  if (!message) {
    throw new Error("LLM вернул пустой ответ");
  }

  return {
    content: message.content || "",
    toolCalls: message.tool_calls || [],
  };
}

export async function runAgentConversation(
  inputMessages: UserFacingMessage[],
  mode: AgentMode = "ASSISTANT",
  style: AgentResponseStyle = "BRIEF",
) {
  const messages = buildContextForModel(inputMessages, mode, style);
  const lastUserMessage = getLastUserMessageContent(inputMessages);

  for (let i = 0; i < 8; i += 1) {
    const modelReply = await callModel(messages, mode);

    if (!modelReply.toolCalls.length) {
      return {
        reply: modelReply.content,
      };
    }

    messages.push({
      role: "assistant",
      content: modelReply.content,
      tool_calls: modelReply.toolCalls,
    });

    for (const toolCall of modelReply.toolCalls) {
      const callId = toolCall.id || `tool_${Date.now()}`;
      const toolName = (toolCall.function?.name || "") as AgentToolName;
      const args = parseJsonArguments(toolCall.function?.arguments);

      if (mode === "PLAN" && MUTATION_TOOLS.has(toolName)) {
        return {
          reply:
            "Сейчас активен режим PLAN: я могу только советовать без изменений. " +
            "Переключите режим на BUILD, и я применю предложенные шаги.",
        };
      }

      if ((toolName === "delete_task" || toolName === "delete_project") && !isDeleteToolCallConfirmed(toolName, args, lastUserMessage)) {
        const id = typeof args.id === "string" ? args.id.trim() : "unknown-id";
        return {
          reply:
            `Нужно подтверждение удаления. Нажмите кнопку 'Подтвердить удаление' ниже или отправьте ` +
            `<!--DELETE_REQUEST:${toolName}=${id}>-->`,
        };
      }

      const result = await executeAgentTool(toolName, args);

      messages.push({
        role: "tool",
        tool_call_id: callId,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    reply: "Я достиг лимита шагов выполнения. Сформулируйте запрос чуть уже, и я продолжу.",
  };
}
