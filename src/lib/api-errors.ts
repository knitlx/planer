type ApiErrorObject = {
  code?: string;
  message?: string;
};

type ApiErrorPayload = {
  error?: string | ApiErrorObject;
  message?: string;
  details?: string;
};

export function extractApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const parsed = payload as ApiErrorPayload;

  if (typeof parsed.error === "string" && parsed.error.trim()) {
    return parsed.error;
  }

  if (parsed.error && typeof parsed.error === "object") {
    if (typeof parsed.error.message === "string" && parsed.error.message.trim()) {
      return parsed.error.message;
    }
  }

  if (typeof parsed.message === "string" && parsed.message.trim()) {
    return parsed.message;
  }

  if (typeof parsed.details === "string" && parsed.details.trim()) {
    return parsed.details;
  }

  return fallback;
}

export async function readApiErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as unknown;
    return extractApiErrorMessage(payload, fallback);
  } catch {
    return fallback;
  }
}
