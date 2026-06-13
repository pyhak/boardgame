import { describe, expect, it } from "vitest";
import { shouldAutoPlayLocalAiTurn } from "./appLogic";

describe("shouldAutoPlayLocalAiTurn", () => {
  it("returns false while white is still forced to continue capturing", () => {
    expect(
      shouldAutoPlayLocalAiTurn(
        {
          currentPlayer: "white",
          winner: null,
        },
        "human-vs-local-ai",
      ),
    ).toBe(false);
  });

  it("returns true only for black turns in local AI mode", () => {
    expect(
      shouldAutoPlayLocalAiTurn(
        {
          currentPlayer: "black",
          winner: null,
        },
        "human-vs-local-ai",
      ),
    ).toBe(true);
  });
});
