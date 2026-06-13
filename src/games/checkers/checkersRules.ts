import type { GameRules, Move, Player } from "../../engine/gameEngine";
import { createInitialCheckersBoard } from "./checkersSetup";
import type { CheckersBoardState, CheckersGameState } from "./checkersTypes";

export const checkersRules: GameRules<CheckersBoardState> = {
  getInitialBoard: createInitialCheckersBoard,
  getLegalMoves,
  isLegalMove,
  applyMove,
  getWinner: () => null,
};

export function getLegalMoves(
  board: CheckersBoardState,
  player: Player,
): Move[] {
  return board.squares.flatMap((square) => {
    if (square.piece?.player !== player) {
      return [];
    }

    return getLegalMovesForSquare(board, square.index, player);
  });
}

export function getLegalMovesForSquare(
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
  if (move.captures?.length || move.promotion) {
    return false;
  }

  return getLegalMovesForSquare(board, move.from, player).some(
    (legalMove) => legalMove.to === move.to,
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

  const movingPiece = board.squares[move.from].piece;

  return {
    ...board,
    squares: board.squares.map((square) => {
      if (square.index === move.from) {
        return { ...square, piece: null };
      }

      if (square.index === move.to) {
        return { ...square, piece: movingPiece };
      }

      return square;
    }),
  };
}

export function applyCheckersMove(
  gameState: CheckersGameState,
  move: Move,
): CheckersGameState {
  const nextBoard = applyMove(gameState.board, gameState.currentPlayer, move);

  if (nextBoard === gameState.board) {
    return gameState;
  }

  return {
    board: nextBoard,
    currentPlayer: getOpponent(gameState.currentPlayer),
  };
}

export function getOpponent(player: Player): Player {
  return player === "black" ? "white" : "black";
}

function getForwardRowDelta(player: Player): number {
  return player === "black" ? 1 : -1;
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

