import type { CheckersAiMoveRequest, OpenAiMoveClient } from "./checkersAi";

interface OpenAiResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
}

interface OpenAiErrorResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

export class ResponsesApiMoveClient implements OpenAiMoveClient {
  constructor(
    private readonly apiKey: string,
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-5.2",
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async chooseMoveIndex(input: CheckersAiMoveRequest): Promise<number> {
    console.info("Calling OpenAI Responses API for checkers", {
      model: this.model,
      currentPlayer: input.currentPlayer,
      legalMoveCount: input.legalMoves.length,
      forcedPieceSquareIndex: input.position.forcedPieceSquareIndex,
      winner: input.position.winner,
      endpoint: "https://api.openai.com/v1/responses",
    });

    const response = await this.fetchFn("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "system",
            content:
              "You choose legal English draughts moves. Return only JSON.",
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "Choose exactly one move by returning {\"selectedIndex\": number}. The index must refer to legalMoves.",
              currentPlayer: input.currentPlayer,
              position: input.position,
              legalMoves: input.legalMoves,
            }),
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "checkers_move_choice",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                selectedIndex: {
                  type: "integer",
                  minimum: 0,
                },
              },
              required: ["selectedIndex"],
            },
            strict: true,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorResponse = await readErrorResponse(response);
      const reason = describeOpenAiFailureReason(
        response.status,
        response.statusText,
        errorResponse,
      );
      console.warn("OpenAI Responses API request failed", {
        status: response.status,
        statusText: response.statusText,
        model: this.model,
        currentPlayer: input.currentPlayer,
        reason,
        errorType: errorResponse?.error?.type,
        errorCode: errorResponse?.error?.code,
      });
      throw new Error(`OpenAI API request failed: ${reason}.`);
    }

    const data = (await response.json()) as OpenAiResponse;
    const text = extractResponseText(data);
    console.info("OpenAI Responses API returned checkers output", {
      model: this.model,
      currentPlayer: input.currentPlayer,
      responseLength: text.length,
    });
    const parsed = JSON.parse(text) as { selectedIndex?: unknown };

    if (typeof parsed.selectedIndex !== "number") {
      console.warn("OpenAI Responses API output did not contain selectedIndex", {
        model: this.model,
        currentPlayer: input.currentPlayer,
        responseLength: text.length,
      });
      throw new Error("OpenAI response did not include selectedIndex.");
    }

    console.info("OpenAI Responses API selected checkers index", {
      model: this.model,
      currentPlayer: input.currentPlayer,
      selectedIndex: parsed.selectedIndex,
    });

    return parsed.selectedIndex;
  }
}

function extractResponseText(response: OpenAiResponse): string {
  if (response.output_text) {
    return response.output_text;
  }

  const text = response.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .find((contentText): contentText is string => Boolean(contentText));

  if (!text) {
    throw new Error("OpenAI response did not include text output.");
  }

  return text;
}

async function readErrorResponse(
  response: Response,
): Promise<OpenAiErrorResponse | null> {
  try {
    return (await response.json()) as OpenAiErrorResponse;
  } catch {
    return null;
  }
}

function describeOpenAiFailureReason(
  status: number,
  statusText: string,
  errorResponse: OpenAiErrorResponse | null,
): string {
  const errorMessage = errorResponse?.error?.message?.trim();

  if (status === 429 || matchesReason(errorMessage, "rate limit")) {
    return "rate limit";
  }

  if (matchesReason(errorMessage, "invalid model")) {
    return "invalid model";
  }

  if (matchesReason(errorMessage, "server error")) {
    return "server error";
  }

  if (status >= 500) {
    return "server error";
  }

  if (status === 401 || status === 403) {
    return "authorization error";
  }

  if (status === 400) {
    return "invalid request";
  }

  return errorMessage ?? statusText ?? `HTTP ${status}`;
}

function matchesReason(message: string | undefined, reason: string): boolean {
  if (!message) {
    return false;
  }

  const normalizedMessage = message.toLowerCase();

  switch (reason) {
    case "rate limit":
      return (
        normalizedMessage.includes("rate limit") ||
        normalizedMessage.includes("too many requests")
      );
    case "invalid model":
      return (
        normalizedMessage.includes("invalid model") ||
        (normalizedMessage.includes("model") &&
          (normalizedMessage.includes("not found") ||
            normalizedMessage.includes("invalid")))
      );
    case "server error":
      return (
        normalizedMessage.includes("server error") ||
        normalizedMessage.includes("internal server error") ||
        normalizedMessage.includes("service unavailable") ||
        normalizedMessage.includes("overloaded")
      );
    default:
      return false;
  }
}
