import { describe, expect, it } from "vitest";
import {
  chooseCheckersAiMove,
  isCheckersAiMoveRequest,
  selectLegalMoveByIndex,
  type CheckersAiMoveRequest,
} from "./checkersAi";

const request: CheckersAiMoveRequest = {
  currentPlayer: "black",
  position: {
    pieces: [
      { index: 17, player: "black", type: "man" },
      { index: 26, player: "white", type: "man" },
    ],
    forcedPieceSquareIndex: null,
    winner: null,
  },
  legalMoves: [{ from: 17, to: 35, captures: [26] }],
};

describe("checkers AI proxy move selection", () => {
  it("validates selected legal move indexes", () => {
    expect(selectLegalMoveByIndex(request.legalMoves, 0)).toEqual(
      request.legalMoves[0],
    );
    expect(selectLegalMoveByIndex(request.legalMoves, 1)).toBeNull();
    expect(selectLegalMoveByIndex(request.legalMoves, -1)).toBeNull();
  });

  it("returns the selected move when the OpenAI client chooses a valid index", async () => {
    await expect(
      chooseCheckersAiMove(request, {
        chooseMoveIndex: async () => 0,
      }),
    ).resolves.toEqual({
      move: request.legalMoves[0],
      selectedIndex: 0,
      fallback: false,
    });
  });

  it("returns a fallback response for invalid OpenAI indexes", async () => {
    await expect(
      chooseCheckersAiMove(request, {
        chooseMoveIndex: async () => 9,
      }),
    ).resolves.toMatchObject({
      move: null,
      selectedIndex: 9,
      fallback: true,
    });
  });

  it("returns a fallback response when OpenAI fails", async () => {
    await expect(
      chooseCheckersAiMove(request, {
        chooseMoveIndex: async () => {
          throw new Error("network");
        },
      }),
    ).resolves.toMatchObject({
      move: null,
      selectedIndex: null,
      fallback: true,
    });
  });

  it("validates request bodies", () => {
    expect(isCheckersAiMoveRequest(request)).toBe(true);
    expect(isCheckersAiMoveRequest({ ...request, legalMoves: ["bad"] })).toBe(
      false,
    );
  });
});
