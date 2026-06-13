export type Player = "black" | "white";

export interface Piece {
  id: string;
  player: Player;
  type: string;
}

export interface BoardState<TPiece extends Piece = Piece> {
  width: number;
  height: number;
  squares: Array<TPiece | null>;
}

export interface Move {
  from: number;
  to: number;
  captures?: number[];
  promotion?: boolean;
}

export interface GameRules<TBoard extends BoardState = BoardState> {
  getInitialBoard(): TBoard;
  getLegalMoves(board: TBoard, player: Player): Move[];
  isLegalMove(board: TBoard, player: Player, move: Move): boolean;
  applyMove(board: TBoard, player: Player, move: Move): TBoard;
  getWinner(board: TBoard): Player | null;
}

