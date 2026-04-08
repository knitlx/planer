"use client";

import { Fragment, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Mic, Send, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { quantumGradientClasses } from "@/lib/quantum-theme";
import { getApiErrorMessage } from "@/lib/api-client";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
};

type PendingDeleteConfirmation = {
  toolName: "delete_task" | "delete_project";
  id: string;
  command: string;
};
type AgentMode = "ASSISTANT" | "PLAN" | "BUILD";
type AgentResponseStyle = "BRIEF" | "DEEP";

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1 py-0.5 rounded bg-black/30 border border-white/10 font-mono text-[0.95em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function MarkdownMessage({ content }: { content: string }) {
  // Скрываем технические HTML-комментарии
  const cleanedContent = content.replace(/<!--DELETE_REQUEST:[^>]*-->/g, "").trim();
  const lines = cleanedContent.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let inCodeFence = false;
  let codeBuffer: string[] = [];

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCodeFence) {
        blocks.push(
          <pre
            key={`code-${i}`}
            className="overflow-x-auto rounded-lg bg-black/35 border border-white/10 p-3 text-xs md:text-sm font-mono"
          >
            <code>{codeBuffer.join("\n")}</code>
          </pre>,
        );
        codeBuffer = [];
        inCodeFence = false;
      } else {
        inCodeFence = true;
      }
      i += 1;
      continue;
    }

    if (inCodeFence) {
      codeBuffer.push(line);
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const cls =
        level === 1
          ? "text-lg md:text-xl font-semibold"
          : level === 2
            ? "text-base md:text-lg font-semibold"
            : "text-sm md:text-base font-semibold";
      blocks.push(
        <p key={`h-${i}`} className={cls}>
          {renderInlineMarkdown(heading[2])}
        </p>,
      );
      i += 1;
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      blocks.push(
        <p key={`b-${i}`} className="pl-4">
          <span className="mr-2">•</span>
          {renderInlineMarkdown(bullet[1])}
        </p>,
      );
      i += 1;
      continue;
    }

    const numbered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      blocks.push(
        <p key={`n-${i}`} className="pl-4">
          <span className="mr-2">{numbered[1]}.</span>
          {renderInlineMarkdown(numbered[2])}
        </p>,
      );
      i += 1;
      continue;
    }

    if (!trimmed) {
      blocks.push(<div key={`sp-${i}`} className="h-2" />);
      i += 1;
      continue;
    }

    blocks.push(
      <p key={`p-${i}`} className="whitespace-pre-wrap">
        {renderInlineMarkdown(line)}
      </p>,
    );
    i += 1;
  }

  return <div className="space-y-1">{blocks}</div>;
}

function makeMessage(role: ChatRole, content: string): ChatMessage {
  return {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  };
}

export default function AgentPageClient() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    makeMessage(
      "assistant",
      "Готов помогать с проектами и задачами. Напишите, что нужно сделать в системе.",
    ),
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mode, setMode] = useState<AgentMode>("ASSISTANT");
  const [responseStyle, setResponseStyle] = useState<AgentResponseStyle>("BRIEF");
  const [pendingDeleteConfirmation, setPendingDeleteConfirmation] =
    useState<PendingDeleteConfirmation | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const savedMode = localStorage.getItem("agent-mode");
    if (savedMode === "ASSISTANT" || savedMode === "PLAN" || savedMode === "BUILD") {
      setMode(savedMode);
    }
    const savedStyle = localStorage.getItem("agent-response-style");
    if (savedStyle === "BRIEF" || savedStyle === "DEEP") {
      setResponseStyle(savedStyle);
    }

    const loadHistory = async () => {
      try {
        const response = await fetch("/api/ai/history", { method: "GET" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          messages?: Array<{ id: string; role: ChatRole; content: string }>;
        };
        if (payload.messages && payload.messages.length > 0) {
          setMessages(payload.messages);
        }
      } catch {
        // ignore loading failures and keep default greeting
      }
    };

    void loadHistory();
  }, []);

  useEffect(() => {
    localStorage.setItem("agent-mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("agent-response-style", responseStyle);
  }, [responseStyle]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isSending]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const canSend = useMemo(() => !!input.trim() && !isSending, [input, isSending]);

  const persistHistory = async (nextMessages: ChatMessage[]) => {
    const response = await fetch("/api/ai/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      }),
    });
    if (!response.ok) {
      throw new Error("Не удалось сохранить историю чата");
    }
  };

  const extractDeleteConfirmation = (text: string): PendingDeleteConfirmation | null => {
    // Новый формат: <!--DELETE_REQUEST:delete_task=abc123-->
    const htmlMatch = text.match(/<!--DELETE_REQUEST:(delete_task|delete_project)=([^\s-]+)-->/i);
    if (htmlMatch) {
      const toolName = htmlMatch[1].toLowerCase() as "delete_task" | "delete_project";
      const id = htmlMatch[2];
      return {
        toolName,
        id,
        command: `CONFIRM_DELETE ${toolName} ${id}`,
      };
    }

    // Старый формат (fallback): CONFIRM_DELETE delete_task abc123
    const match = text.match(/CONFIRM_DELETE\s+(delete_task|delete_project)\s+([^\s]+)/i);
    if (!match) return null;
    const toolName = match[1].toLowerCase() as "delete_task" | "delete_project";
    const id = match[2];
    return {
      toolName,
      id,
      command: `CONFIRM_DELETE ${toolName} ${id}`,
    };
  };

  const sendAgentMessage = async (rawText: string, options?: { keepInput?: boolean }) => {
    const text = rawText.trim();
    if (!text) return;

    const userMessage = makeMessage("user", text);
    const nextMessages = [...messages, userMessage];

    setPendingDeleteConfirmation(null);
    setMessages(nextMessages);
    void persistHistory(nextMessages).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Ошибка сохранения истории");
    });
    if (!options?.keepInput) {
      setInput("");
    }
    setIsSending(true);

    try {
      const response = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          responseStyle,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as unknown;
        throw new Error(getApiErrorMessage(payload) || "AI-агент не ответил");
      }

      const payload = (await response.json()) as { reply?: string };
      const replyText =
        (payload.reply || "").trim() || "Получил запрос, но не смог сформировать ответ.";

      const withAssistant = [...nextMessages, makeMessage("assistant", replyText)];
      setPendingDeleteConfirmation(extractDeleteConfirmation(replyText));
      setMessages(withAssistant);
      void persistHistory(withAssistant).catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Ошибка сохранения истории");
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка общения с агентом");
      setPendingDeleteConfirmation(null);
      const withError = [
        ...nextMessages,
        makeMessage("assistant", "Не удалось обработать запрос. Попробуйте снова."),
      ];
      setMessages(withError);
      void persistHistory(withError).catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : "Ошибка сохранения истории");
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendMessage = async () => {
    await sendAgentMessage(input);
  };

  const confirmDeletion = async () => {
    if (!pendingDeleteConfirmation) return;
    await sendAgentMessage(pendingDeleteConfirmation.command, { keepInput: true });
  };

  const cancelDeletion = () => {
    setPendingDeleteConfirmation(null);
    const withCancel = [...messages, makeMessage("assistant", "Óäàëåíèå îòìåíåíî. Íè÷åãî íå óäàëÿë.")];
    setMessages(withCancel);
    void persistHistory(withCancel).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Îøèáêà ñîõðàíåíèÿ èñòîðèè");
    });
  };

  const startRecording = async () => {
    if (isRecording) return;
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast.error("Браузер не поддерживает запись аудио");
      return;
    }

    // Check for Android runtime permissions
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (result.state === 'denied') {
          toast.error("Отказано в доступе к микрофону в настройках приложения");
          return;
        }
      } catch (error) {
        // Permission API not available, continue with getUserMedia
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        toast.error("Ошибка записи аудио");
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      mediaStreamRef.current = stream;
      setIsRecording(true);
    } catch (error) {
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          toast.error("Отказано в доступе к микрофону. Проверьте настройки приложения");
        } else if (error.name === 'NotFoundError') {
          toast.error("Микрофон не найден");
        } else if (error.name === 'NotReadableError') {
          toast.error("Микрофон не доступен для чтения");
        } else {
          toast.error(`Ошибка доступа к микрофону: ${error.name}`);
        }
      } else {
        toast.error("Не удалось начать запись аудио");
      }
    }
  };

  const stopRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;

    setIsRecording(false);
    setIsTranscribing(true);

    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const merged = new Blob(audioChunksRef.current, { type: "audio/webm" });
        resolve(merged);
      };
      recorder.stop();
    });

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    try {
      const form = new FormData();
      form.append("audio", new File([blob], "voice.webm", { type: "audio/webm" }));

      const response = await fetch("/api/ai/transcribe", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const payload = (await response.json()) as unknown;
        throw new Error(getApiErrorMessage(payload) || "Транскрибация не удалась");
      }

      const payload = (await response.json()) as { text?: string };
      const text = (payload.text || "").trim();
      if (!text) {
        toast.error("Не удалось распознать речь");
        return;
      }

      setInput((prev) => [prev.trim(), text].filter(Boolean).join(" "));
      toast.success("Речь распознана");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка транскрибации");
    } finally {
      setIsTranscribing(false);
    }
  };

  const clearChat = () => {
    const base = [
      makeMessage(
        "assistant",
        "История очищена. Можете продолжить, и я помогу с новыми изменениями.",
      ),
    ];
    setPendingDeleteConfirmation(null);
    setMessages(base);
    void fetch("/api/ai/history", { method: "DELETE" });
    void persistHistory(base).catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Ошибка сохранения истории");
    });
  };

  return (
    <section className="p-6 md:p-12 space-y-6 min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-qf-bg-secondary border border-qf-border-accent flex items-center justify-center">
            <Bot className="w-6 h-6 text-[#FFC300]" strokeWidth={2.3} />
          </div>
          <div>
            <h1 className={`text-3xl md:text-4xl font-bold ${quantumGradientClasses.text}`}>
              AI Агент
            </h1>
            <p className="text-qf-text-secondary text-sm md:text-base">
              Управление проектами, задачами и идеями через диалог
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-qf-border-primary bg-qf-bg-secondary p-1">
            <button
              type="button"
              onClick={() => setMode("ASSISTANT")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mode === "ASSISTANT"
                  ? "bg-[#FFC300] text-[#0A0908]"
                  : "text-qf-text-secondary hover:text-qf-text-primary"
              }`}
            >
              Assistant
            </button>
            <button
              type="button"
              onClick={() => setMode("PLAN")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mode === "PLAN"
                  ? "bg-[#FFC300] text-[#0A0908]"
                  : "text-qf-text-secondary hover:text-qf-text-primary"
              }`}
            >
              Plan
            </button>
            <button
              type="button"
              onClick={() => setMode("BUILD")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                mode === "BUILD"
                  ? "bg-[#FFC300] text-[#0A0908]"
                  : "text-qf-text-secondary hover:text-qf-text-primary"
              }`}
            >
              Build
            </button>
          </div>

          <div className="inline-flex rounded-lg border border-qf-border-primary bg-qf-bg-secondary p-1">
            <button
              type="button"
              onClick={() => setResponseStyle("BRIEF")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                responseStyle === "BRIEF"
                  ? "bg-[#FFC300] text-[#0A0908]"
                  : "text-qf-text-secondary hover:text-qf-text-primary"
              }`}
            >
              Кратко
            </button>
            <button
              type="button"
              onClick={() => setResponseStyle("DEEP")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                responseStyle === "DEEP"
                  ? "bg-[#FFC300] text-[#0A0908]"
                  : "text-qf-text-secondary hover:text-qf-text-primary"
              }`}
            >
              Подробно
            </button>
          </div>

          <Button
            variant="secondary"
            onClick={clearChat}
            className="border-qf-border-primary bg-qf-bg-secondary"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Очистить чат
          </Button>
        </div>
      </header>

      <div className="rounded-xl border border-qf-border-secondary bg-qf-bg-secondary/40 px-3 py-2 text-xs text-qf-text-secondary">
        {mode === "ASSISTANT"
          ? "Режим ASSISTANT: обычный исполнитель ваших команд."
          : mode === "PLAN"
            ? "Режим PLAN: советник без изменений в данных."
            : "Режим BUILD: советник с возможностью применять изменения."}{" "}
        {responseStyle === "BRIEF"
          ? "Стиль: кратко."
          : "Стиль: подробно (больше рассуждений)."}
      </div>

      <div
        ref={listRef}
        className="h-[58vh] overflow-y-auto rounded-2xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-4 md:p-6 space-y-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-3xl rounded-2xl px-4 py-3 leading-relaxed text-sm md:text-[15px] ${
              message.role === "user"
                ? "ml-auto bg-[#FFC300] text-[#0A0908]"
                : "mr-auto bg-qf-bg-secondary border border-qf-border-primary text-qf-text-primary"
            }`}
          >
            {message.role === "assistant" ? (
              <MarkdownMessage content={message.content} />
            ) : (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>
        ))}

        {isSending && (
          <div className="mr-auto max-w-xl rounded-2xl px-4 py-3 bg-qf-bg-secondary border border-qf-border-primary text-qf-text-secondary text-sm">
            Агент думает...
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-qf-border-secondary bg-qf-bg-glass backdrop-blur-lg p-3 md:p-4">
        {pendingDeleteConfirmation && (
          <div className="mb-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
            <p className="text-sm text-red-200">
              Подтвердите удаление ({pendingDeleteConfirmation.id}) или отмените действие.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void confirmDeletion()}
                disabled={isSending}
                className="bg-red-500 text-white hover:bg-red-500/90"
              >
                Подтвердить удаление
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={cancelDeletion}
                disabled={isSending}
              >
                Отмена
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Например: создай проект 'Запуск MVP' и добавь в него 3 задачи"
            className="flex-1 min-h-[44px] max-h-[120px] rounded-md border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-sm text-qf-text-primary placeholder:text-qf-text-muted focus:outline-none focus:border-qf-border-accent resize-y"
            rows={1}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void (isRecording ? stopRecording() : startRecording())}
              disabled={isTranscribing || isSending}
              className={`${isRecording ? "border-red-400 text-red-300" : ""}`}
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="ml-2">
                {isRecording ? "Стоп" : isTranscribing ? "Распознаю..." : "Голос"}
              </span>
            </Button>

            <Button onClick={() => void sendMessage()} disabled={!canSend}>
              <Send className="w-4 h-4 mr-2" />
              Отправить
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
