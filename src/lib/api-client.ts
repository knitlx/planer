export function getApiErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  const error = record.error;

  if (typeof error === "string") return error;

  if (error && typeof error === "object") {
    const message = (error as Record<string, unknown>).message;
    if (typeof message === "string") return message;
  }

  const message = record.message;
  if (typeof message === "string") return message;

  return null;
}

