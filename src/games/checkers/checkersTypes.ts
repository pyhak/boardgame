import type { BoardState, Move, Piece, Player } from "../../engine/gameEngine";

export type CheckersPieceType = "man" | "king";

export interface CheckersPiece extends Piece {
  type: CheckersPieceType;
}

export type CheckersBoardState = BoardState<CheckersPiece>;

export interface CheckersGameState {
  board: CheckersBoardState;
  currentPlayer: Player;
  selectedSquareIndex: number | null;
  legalTargetIndexes: number[];
  forcedPieceSquareIndex: number | null;
  winner: Player | null;
  statusMessage: string;
}

export type CheckersMove = Move;

export interface CheckersMoveRecord {
  player: Player;
  from: number;
  to: number;
  captures: number[];
  promotion: boolean;
}
