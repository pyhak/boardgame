import type { AiMoveInput, AiOpponent } from "./AiOpponent";
import type { Move } from "../engine/gameEngine";
import type { CheckersGameState } from "../games/checkers/checkersTypes";

interface OpenAiMoveResponse {
  move: Move | null;
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
      return null;
    }

    const result = (await response.json()) as OpenAiMoveResponse;

    if (result.fallback || !result.move) {
      return null;
    }

    const selectedMove = result.move;

    return input.legalMoves.some((move) => sameMove(move, selectedMove))
      ? selectedMove
      : null;
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
