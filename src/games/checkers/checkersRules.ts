import type { GameRules, Move, Player } from "../../engine/gameEngine";
import { createInitialCheckersBoard } from "./checkersSetup";
import type { CheckersBoardState } from "./checkersTypes";

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

  const nextRow = fromSquare.coordinate.row + getForwardRowDelta(player);
  const landingRow = fromSquare.coordinate.row + getForwardRowDelta(player) * 2;
  const nextColumns = [
    fromSquare.coordinate.column - 1,
    fromSquare.coordinate.column + 1,
  ];
  const landingColumns = [
    fromSquare.coordinate.column - 2,
    fromSquare.coordinate.column + 2,
  ];

  return nextColumns.flatMap((middleColumn, index) => {
    const middle = getSquareIndex(board, nextRow, middleColumn);
    const to = getSquareIndex(board, landingRow, landingColumns[index]);

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

  const nextRow = fromSquare.coordinate.row + getForwardRowDelta(player);
  const nextColumns = [
    fromSquare.coordinate.column - 1,
    fromSquare.coordinate.column + 1,
  ];

  return nextColumns.flatMap((column) => {
    const to = getSquareIndex(board, nextRow, column);

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
  if (move.promotion) {
    return false;
  }

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
  const capturedIndexes = legalMove.captures ?? [];

  return {
    ...board,
    squares: board.squares.map((square) => {
      if (square.index === move.from || capturedIndexes.includes(square.index)) {
        return { ...square, piece: null };
      }

      if (square.index === move.to) {
        return { ...square, piece: movingPiece };
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

function getForwardRowDelta(player: Player): number {
  return player === "black" ? 1 : -1;
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
