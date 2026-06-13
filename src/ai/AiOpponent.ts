import type { Move, Player } from "../engine/types";

export interface AiMoveInput<TPosition, TMove extends Move = Move> {
  position: TPosition;
  player: Player;
  legalMoves: TMove[];
  history?: Array<{
    player: Player;
    move: TMove;
  }>;
}

export interface AiOpponent<TPosition, TMove extends Move = Move> {
  id: string;
  name: string;
  chooseMove(input: AiMoveInput<TPosition, TMove>): Promise<TMove | null>;
}
