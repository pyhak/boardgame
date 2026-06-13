import type { Move } from "../engine/gameEngine";
import { checkersGameService } from "../games/checkers/checkersGameService";
import type { CheckersGameState } from "../games/checkers/checkersTypes";
import type { AiOpponent } from "./AiOpponent";

type RandomNumberGenerator = () => number;

export class RandomCheckersAiOpponent
  implements AiOpponent<CheckersGameState, Move>
{
  readonly id = "random-checkers";
  readonly name = "Random AI";

  constructor(private readonly random: RandomNumberGenerator = Math.random) {}

  async chooseMove(input: {
    gameState: CheckersGameState;
    legalMoves: Move[];
  }): Promise<Move | null> {
    if (input.gameState.winner) {
      return null;
    }

    const legalMoves = checkersGameService.getLegalMoves(input.gameState);

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
