import { afterEach, describe, expect, it, vi } from "vitest";
import { checkersGameService } from "../games/checkers/checkersGameService";
import { OpenAiCheckersOpponent } from "./OpenAiCheckersOpponent";

describe("OpenAiCheckersOpponent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls the local proxy and returns a validated legal move", async () => {
    const gameState = checkersGameService.createInitialState();
    const legalMoves = checkersGameService.getLegalMoves(gameState);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          move: legalMoves[0],
          fallback: false,
        }),
        { status: 200 },
      ),
    );

    const opponent = new OpenAiCheckersOpponent("/api/test");
    const move = await opponent.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves,
    });

    expect(move).toEqual(legalMoves[0]);
    expect(fetch).toHaveBeenCalledWith(
      "/api/test",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejects proxy moves that are not in legalMoves", async () => {
    const gameState = checkersGameService.createInitialState();
    const legalMoves = checkersGameService.getLegalMoves(gameState);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          move: { from: 0, to: 9 },
          fallback: false,
        }),
        { status: 200 },
      ),
    );

    const opponent = new OpenAiCheckersOpponent("/api/test");

    await expect(
      opponent.chooseMove({
        position: gameState,
        player: gameState.currentPlayer,
        legalMoves,
      }),
    ).resolves.toBeNull();
  });
});
