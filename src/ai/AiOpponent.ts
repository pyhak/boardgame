import type { Move } from "../engine/types";

export interface AiOpponent<TGameState, TMove extends Move = Move> {
  id: string;
  name: string;
  chooseMove(input: {
    gameState: TGameState;
    legalMoves: TMove[];
  }): Promise<TMove | null>;
}
