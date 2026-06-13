export type Player = "black" | "white";

export interface Piece {
  id: string;
  player: Player;
  type: string;
}

export interface BoardCoordinate {
  row: number;
  column: number;
}

export interface BoardSquare<TPiece extends Piece = Piece> {
  index: number;
  coordinate: BoardCoordinate;
  piece: TPiece | null;
}

export interface BoardState<TPiece extends Piece = Piece> {
  width: number;
  height: number;
  squares: Array<BoardSquare<TPiece>>;
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
