import type { Move } from "../engine/gameEngine";
import type { CheckersGameState } from "../games/checkers/checkersTypes";
import type { AiMoveInput, AiOpponent } from "./AiOpponent";

type RandomNumberGenerator = () => number;

export class RandomCheckersAiOpponent
  implements AiOpponent<CheckersGameState, Move>
{
  readonly id = "random-checkers";
  readonly name = "Random AI";

  constructor(
    private readonly random: RandomNumberGenerator = Math.random,
  ) {}

  async chooseMove(
    input: AiMoveInput<CheckersGameState, Move>,
  ): Promise<Move | null> {
    if (input.position.winner) {
      return null;
    }

    const legalMoves = input.legalMoves;

    if (legalMoves.length === 0) {
      return null;
    }

    const index = Math.min(
      Math.floor(this.random() * legalMoves.length),
      legalMoves.length - 1,
    );

    return legalMoves[index];
  }
}
