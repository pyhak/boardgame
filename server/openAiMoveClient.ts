import type { CheckersAiMoveRequest, OpenAiMoveClient } from "./checkersAi";

interface OpenAiResponse {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
}

export class ResponsesApiMoveClient implements OpenAiMoveClient {
  constructor(
    private readonly apiKey: string,
    private readonly model = process.env.OPENAI_MODEL ?? "gpt-5.2",
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async chooseMoveIndex(input: CheckersAiMoveRequest): Promise<number> {
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
      throw new Error(`OpenAI request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OpenAiResponse;
    const text = extractResponseText(data);
    const parsed = JSON.parse(text) as { selectedIndex?: unknown };

    if (typeof parsed.selectedIndex !== "number") {
      throw new Error("OpenAI response did not include selectedIndex.");
    }

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
