import type { AiMoveInput, AiOpponent } from "./AiOpponent";
import type { Move } from "../engine/gameEngine";
import type { CheckersGameState } from "../games/checkers/checkersTypes";

interface OpenAiMoveResponse {
  move: Move | null;
  selectedIndex?: number | null;
  fallback: boolean;
  error?: string;
}

export class OpenAiCheckersOpponent
  implements AiOpponent<CheckersGameState, Move>
{
  readonly id = "openai-checkers";
  readonly name = "OpenAI AI";

  constructor(private readonly endpoint = "/api/ai/checkers/move") {}

  async chooseMove(
    input: AiMoveInput<CheckersGameState, Move>,
  ): Promise<Move | null> {
    if (input.position.winner || input.legalMoves.length === 0) {
      return null;
    }

    console.info("Requesting OpenAI checkers move", {
      endpoint: this.endpoint,
      player: input.player,
      legalMoveCount: input.legalMoves.length,
      forcedPieceSquareIndex: input.position.forcedPieceSquareIndex,
      winner: input.position.winner,
    });

    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        position: compactCheckersPosition(input.position),
        currentPlayer: input.player,
        legalMoves: input.legalMoves,
      }),
    });

    if (!response.ok) {
      const errorResponse = await readMoveResponse(response);
      console.warn("OpenAI checkers move request failed", {
        endpoint: this.endpoint,
        status: response.status,
        ok: response.ok,
        error: errorResponse?.error,
        fallback: errorResponse?.fallback,
        selectedIndex: errorResponse?.selectedIndex,
        moveReturned: Boolean(errorResponse?.move),
      });
      throw new Error(
        errorResponse?.error ??
          `OpenAI proxy request failed with status ${response.status}.`,
      );
    }

    const result = await readMoveResponse(response);

    console.info("OpenAI checkers move response received", {
      endpoint: this.endpoint,
      ok: response.ok,
      status: response.status,
      fallback: result?.fallback,
      selectedIndex: result?.selectedIndex,
      moveReturned: Boolean(result?.move),
      error: result?.error,
    });

    if (!result || result.fallback || !result.move) {
      console.warn("OpenAI checkers move response did not include a move", {
        endpoint: this.endpoint,
        fallback: result?.fallback,
        error: result?.error,
      });
      throw new Error(
        result?.error ?? "OpenAI proxy response did not include a move.",
      );
    }

    const selectedMove = result.move;

    if (!input.legalMoves.some((move) => sameMove(move, selectedMove))) {
      console.warn("OpenAI checkers move was rejected by client validation", {
        endpoint: this.endpoint,
        from: selectedMove.from,
        to: selectedMove.to,
        legalMoveCount: input.legalMoves.length,
      });
      throw new Error("OpenAI proxy returned an illegal move.");
    }

    return selectedMove;
  }
}

async function readMoveResponse(response: Response): Promise<OpenAiMoveResponse | null> {
  try {
    return (await response.json()) as OpenAiMoveResponse;
  } catch {
    return null;
  }
}

function compactCheckersPosition(position: CheckersGameState) {
  return {
    forcedPieceSquareIndex: position.forcedPieceSquareIndex,
    winner: position.winner,
    pieces: position.board.squares.flatMap((square) =>
      square.piece
        ? [
            {
              index: square.index,
              player: square.piece.player,
              type: square.piece.type,
            },
          ]
        : [],
    ),
  };
}

function sameMove(left: Move, right: Move): boolean {
  return (
    left.from === right.from &&
    left.to === right.to &&
    sameCaptures(left.captures ?? [], right.captures ?? [])
  );
}

function sameCaptures(left: number[], right: number[]): boolean {
  return (
    left.length === right.length &&
    left.every((capture, index) => capture === right[index])
  );
}
