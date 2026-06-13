import type { Move } from "../engine/gameEngine";
import { checkersGameService } from "../games/checkers/checkersGameService";
import type { CheckersGameState } from "../games/checkers/checkersTypes";
import type { AiMoveInput, AiOpponent } from "./AiOpponent";

type RandomNumberGenerator = () => number;
type CheckersLegalMoveProvider = (position: CheckersGameState) => Move[];

export class RandomCheckersAiOpponent
  implements AiOpponent<CheckersGameState, Move>
{
  readonly id = "random-checkers";
  readonly name = "Random AI";

  constructor(
    private readonly random: RandomNumberGenerator = Math.random,
    private readonly getLegalMoves: CheckersLegalMoveProvider = (position) =>
      checkersGameService.getLegalMoves(position),
  ) {}

  async chooseMove(
    input: AiMoveInput<CheckersGameState, Move>,
  ): Promise<Move | null> {
    if (input.position.winner) {
      return null;
    }

    const legalMoves = this.getLegalMoves(input.position);

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
