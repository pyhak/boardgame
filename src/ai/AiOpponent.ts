import type { BoardState, Move, Player } from "../engine/types";

export interface AiOpponent<TBoard extends BoardState = BoardState> {
  id: string;
  name: string;
  chooseMove(input: {
    board: TBoard;
    player: Player;
    legalMoves: Move[];
  }): Promise<Move>;
}

