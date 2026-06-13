import { describe, expect, it } from "vitest";
import { formatOpenAiFailureMessage } from "./openAiFailureMessage";

describe("formatOpenAiFailureMessage", () => {
  it("renders a generic message without a reason", () => {
    expect(formatOpenAiFailureMessage(new Error(""))).toBe(
      "OpenAI AI ei saanud praegu käiku teha.",
    );
  });

  it("renders a short rate limit reason", () => {
    expect(
      formatOpenAiFailureMessage(
        new Error("OpenAI API request failed: rate limit."),
      ),
    ).toBe("OpenAI AI ei saanud praegu käiku teha. rate limit");
  });

  it("maps common upstream errors to a short reason", () => {
    expect(
      formatOpenAiFailureMessage(
        new Error("OpenAI request failed with status 500: Internal Server Error"),
      ),
    ).toBe("OpenAI AI ei saanud praegu käiku teha. server error");
  });
});
