import type { GameRules, Move, Player } from "../../engine/gameEngine";
import { createInitialCheckersBoard } from "./checkersSetup";
import type { CheckersBoardState, CheckersPiece } from "./checkersTypes";

export const checkersRules: GameRules<CheckersBoardState> = {
  getInitialBoard: createInitialCheckersBoard,
  getLegalMoves,
  isLegalMove,
  applyMove,
  getWinner,
};

export function getLegalMoves(
  board: CheckersBoardState,
  player: Player,
): Move[] {
  const capturingMoves = getCapturingMoves(board, player);

  if (capturingMoves.length > 0) {
    return capturingMoves;
  }

  return getSimpleMoves(board, player);
}

export function getLegalMovesForSquare(
  board: CheckersBoardState,
  from: number,
  player: Player,
): Move[] {
  const capturingMoves = getCapturingMovesForSquare(board, from, player);

  if (capturingMoves.length > 0) {
    return capturingMoves;
  }

  if (hasAnyCapture(board, player)) {
    return [];
  }

  return getSimpleMovesForSquare(board, from, player);
}

export function getCapturingMoves(
  board: CheckersBoardState,
  player: Player,
): Move[] {
  return board.squares.flatMap((square) => {
    if (square.piece?.player !== player) {
      return [];
    }

    return getCapturingMovesForSquare(board, square.index, player);
  });
}

export function getCapturingMovesForSquare(
  board: CheckersBoardState,
  from: number,
  player: Player,
): Move[] {
  const fromSquare = board.squares[from];

  if (!fromSquare || fromSquare.piece?.player !== player) {
    return [];
  }

  const piece = fromSquare.piece;

  if (piece.type === "king") {
    return getKingCapturingMovesForSquare(board, from, piece);
  }

  return getMoveDirections(piece).flatMap(([rowDelta, columnDelta]) => {
    const middle = getSquareIndex(
      board,
      fromSquare.coordinate.row + rowDelta,
      fromSquare.coordinate.column + columnDelta,
    );
    const to = getSquareIndex(
      board,
      fromSquare.coordinate.row + rowDelta * 2,
      fromSquare.coordinate.column + columnDelta * 2,
    );

    if (middle === null || to === null || board.squares[to].piece !== null) {
      return [];
    }

    const capturedPiece = board.squares[middle].piece;

    if (!capturedPiece || capturedPiece.player === player) {
      return [];
    }

    return [{ from, to, captures: [middle] }];
  });
}

function getSimpleMoves(board: CheckersBoardState, player: Player): Move[] {
  return board.squares.flatMap((square) => {
    if (square.piece?.player !== player) {
      return [];
    }

    return getSimpleMovesForSquare(board, square.index, player);
  });
}

function getSimpleMovesForSquare(
  board: CheckersBoardState,
  from: number,
  player: Player,
): Move[] {
  const fromSquare = board.squares[from];

  if (!fromSquare || fromSquare.piece?.player !== player) {
    return [];
  }

  const piece = fromSquare.piece;

  if (piece.type === "king") {
    return getKingSimpleMovesForSquare(board, from);
  }

  return getMoveDirections(piece).flatMap(([rowDelta, columnDelta]) => {
    const to = getSquareIndex(
      board,
      fromSquare.coordinate.row + rowDelta,
      fromSquare.coordinate.column + columnDelta,
    );

    if (to === null || board.squares[to].piece !== null) {
      return [];
    }

    return [{ from, to }];
  });
}

export function isLegalMove(
  board: CheckersBoardState,
  player: Player,
  move: Move,
): boolean {
  return getLegalMovesForSquare(board, move.from, player).some(
    (legalMove) =>
      legalMove.to === move.to && capturesMatchWhenProvided(legalMove, move),
  );
}

export function applyMove(
  board: CheckersBoardState,
  player: Player,
  move: Move,
): CheckersBoardState {
  if (!isLegalMove(board, player, move)) {
    return board;
  }

  const legalMove = getLegalMovesForSquare(board, move.from, player).find(
    (candidate) =>
      candidate.to === move.to && capturesMatchWhenProvided(candidate, move),
  );

  if (!legalMove) {
    return board;
  }

  const movingPiece = board.squares[move.from].piece;
  const nextPiece = movingPiece
    ? promotePieceIfNeeded(movingPiece, board.squares[move.to].coordinate.row)
    : null;
  const capturedIndexes = legalMove.captures ?? [];

  return {
    ...board,
    squares: board.squares.map((square) => {
      if (square.index === move.from || capturedIndexes.includes(square.index)) {
        return { ...square, piece: null };
      }

      if (square.index === move.to) {
        return { ...square, piece: nextPiece };
      }

      return square;
    }),
  };
}

export function getWinner(board: CheckersBoardState): Player | null {
  const blackPieces = countPieces(board, "black");
  const whitePieces = countPieces(board, "white");

  if (blackPieces === 0) {
    return "white";
  }

  if (whitePieces === 0) {
    return "black";
  }

  if (getLegalMoves(board, "black").length === 0) {
    return "white";
  }

  if (getLegalMoves(board, "white").length === 0) {
    return "black";
  }

  return null;
}

export function getOpponent(player: Player): Player {
  return player === "black" ? "white" : "black";
}

function getMoveDirections(piece: CheckersPiece): Array<[number, number]> {
  if (piece.type === "king") {
    return [
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ];
  }

  const rowDelta = piece.player === "black" ? 1 : -1;

  return [
    [rowDelta, -1],
    [rowDelta, 1],
  ];
}

function getKingSimpleMovesForSquare(
  board: CheckersBoardState,
  from: number,
): Move[] {
  const fromSquare = board.squares[from];
  const moves: Move[] = [];

  for (const [rowDelta, columnDelta] of getMoveDirections({
    id: "king-directions",
    player: "black",
    type: "king",
  })) {
    let row = fromSquare.coordinate.row + rowDelta;
    let column = fromSquare.coordinate.column + columnDelta;

    while (true) {
      const to = getSquareIndex(board, row, column);

      if (to === null || board.squares[to].piece !== null) {
        break;
      }

      moves.push({ from, to });
      row += rowDelta;
      column += columnDelta;
    }
  }

  return moves;
}

function getKingCapturingMovesForSquare(
  board: CheckersBoardState,
  from: number,
  piece: CheckersPiece,
): Move[] {
  const fromSquare = board.squares[from];
  const moves: Move[] = [];

  for (const [rowDelta, columnDelta] of getMoveDirections(piece)) {
    let capturedIndex: number | null = null;
    let row = fromSquare.coordinate.row + rowDelta;
    let column = fromSquare.coordinate.column + columnDelta;

    while (true) {
      const index = getSquareIndex(board, row, column);

      if (index === null) {
        break;
      }

      const squarePiece = board.squares[index].piece;

      if (!squarePiece && capturedIndex === null) {
        row += rowDelta;
        column += columnDelta;
        continue;
      }

      if (!squarePiece && capturedIndex !== null) {
        moves.push({ from, to: index, captures: [capturedIndex] });
        row += rowDelta;
        column += columnDelta;
        continue;
      }

      if (squarePiece?.player === piece.player) {
        break;
      }

      if (capturedIndex !== null) {
        break;
      }

      capturedIndex = index;
      row += rowDelta;
      column += columnDelta;
    }
  }

  return moves;
}

function hasAnyCapture(board: CheckersBoardState, player: Player): boolean {
  return getCapturingMoves(board, player).length > 0;
}

function countPieces(board: CheckersBoardState, player: Player): number {
  return board.squares.filter((square) => square.piece?.player === player)
    .length;
}

function capturesMatchWhenProvided(legalMove: Move, requestedMove: Move): boolean {
  if (!requestedMove.captures) {
    return true;
  }

  const leftCaptures = legalMove.captures ?? [];
  const rightCaptures = requestedMove.captures;

  return (
    leftCaptures.length === rightCaptures.length &&
    leftCaptures.every((capture, index) => capture === rightCaptures[index])
  );
}

function promotePieceIfNeeded(
  piece: CheckersPiece,
  destinationRow: number,
): CheckersPiece {
  if (piece.type === "king") {
    return piece;
  }

  if (
    (piece.player === "black" && destinationRow === 7) ||
    (piece.player === "white" && destinationRow === 0)
  ) {
    return {
      ...piece,
      type: "king",
    };
  }

  return piece;
}

function getSquareIndex(
  board: CheckersBoardState,
  row: number,
  column: number,
): number | null {
  if (row < 0 || row >= board.height || column < 0 || column >= board.width) {
    return null;
  }

  return row * board.width + column;
}
