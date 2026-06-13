import type { Move } from "../../engine/gameEngine";
import { createInitialCheckersGameState } from "./checkersSetup";
import {
  applyMove,
  getLegalMovesForSquare,
  getOpponent,
} from "./checkersRules";
import type { CheckersGameState } from "./checkersTypes";

export interface CheckersGameService {
  createInitialState(): CheckersGameState;
  handleSquareClick(
    gameState: CheckersGameState,
    squareIndex: number,
  ): CheckersGameState;
  applyMove(gameState: CheckersGameState, move: Move): CheckersGameState;
}

export const checkersGameService: CheckersGameService = {
  createInitialState: createInitialCheckersGameState,
  handleSquareClick,
  applyMove: applyCheckersMove,
};

function handleSquareClick(
  gameState: CheckersGameState,
  squareIndex: number,
): CheckersGameState {
  const square = gameState.board.squares[squareIndex];
  const isCurrentPlayerPiece =
    square?.piece?.player === gameState.currentPlayer;

  if (gameState.selectedSquareIndex === null) {
    return isCurrentPlayerPiece ? selectSquare(gameState, squareIndex) : gameState;
  }

  if (isCurrentPlayerPiece) {
    return selectSquare(gameState, squareIndex);
  }

  return applyCheckersMove(gameState, {
    from: gameState.selectedSquareIndex,
    to: squareIndex,
  });
}

function applyCheckersMove(
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
    selectedSquareIndex: null,
    legalTargetIndexes: [],
  };
}

function selectSquare(
  gameState: CheckersGameState,
  squareIndex: number,
): CheckersGameState {
  return {
    ...gameState,
    selectedSquareIndex: squareIndex,
    legalTargetIndexes: getLegalMovesForSquare(
      gameState.board,
      squareIndex,
      gameState.currentPlayer,
    ).map((move) => move.to),
  };
}
