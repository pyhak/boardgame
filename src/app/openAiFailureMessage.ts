const openAiFailurePrefix = "OpenAI API request failed:";

export function formatOpenAiFailureMessage(error: unknown): string {
  const baseMessage = "OpenAI AI ei saanud praegu käiku teha.";
  const reason = extractOpenAiFailureReason(error);

  return reason ? `${baseMessage} ${reason}` : baseMessage;
}

function extractOpenAiFailureReason(error: unknown): string | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message.trim();
  const normalizedMessage = message.toLowerCase();

  if (!message) {
    return null;
  }

  if (message.startsWith(openAiFailurePrefix)) {
    const reason = message.slice(openAiFailurePrefix.length).trim();
    return reason.endsWith(".") ? reason.slice(0, -1) : reason;
  }

  if (
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("too many requests")
  ) {
    return "rate limit";
  }

  if (
    normalizedMessage.includes("invalid model") ||
    normalizedMessage.includes("model not found") ||
    normalizedMessage.includes("model")
  ) {
    return "invalid model";
  }

  if (
    normalizedMessage.includes("server error") ||
    normalizedMessage.includes("internal server error") ||
    normalizedMessage.includes("service unavailable")
  ) {
    return "server error";
  }

  if (normalizedMessage.includes("invalid move index")) {
    return "invalid move index";
  }

  return message;
}
