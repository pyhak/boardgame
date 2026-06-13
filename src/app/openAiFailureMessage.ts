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

  if (!message) {
    return null;
  }

  if (message.startsWith(openAiFailurePrefix)) {
    const reason = message.slice(openAiFailurePrefix.length).trim();
    return reason.endsWith(".") ? reason.slice(0, -1) : reason;
  }

  if (message.includes("rate limit") || message.includes("Too Many Requests")) {
    return "rate limit";
  }

  if (
    message.includes("invalid model") ||
    message.includes("model not found") ||
    message.includes("model")
  ) {
    return "invalid model";
  }

  if (
    message.includes("server error") ||
    message.includes("internal server error") ||
    message.includes("service unavailable")
  ) {
    return "server error";
  }

  if (message.includes("invalid move index")) {
    return "invalid move index";
  }

  return message;
}
