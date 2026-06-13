import type { Move } from "../../engine/gameEngine";
import { createInitialCheckersGameState } from "./checkersSetup";
import {
  applyMove,
  getCapturingMovesForSquare,
  getLegalMoves,
  getLegalMovesForSquare,
  getOpponent,
  getWinner,
} from "./checkersRules";
import type { CheckersGameState } from "./checkersTypes";

export interface CheckersGameService {
  createInitialState(): CheckersGameState;
  handleSquareClick(
    gameState: CheckersGameState,
    squareIndex: number,
  ): CheckersGameState;
  getLegalMoves(gameState: CheckersGameState): Move[];
  applyMove(gameState: CheckersGameState, move: Move): CheckersGameState;
}

export const checkersGameService: CheckersGameService = {
  createInitialState: createInitialCheckersGameState,
  handleSquareClick,
  getLegalMoves: getLegalCheckersMoves,
  applyMove: applyCheckersMove,
};

function handleSquareClick(
  gameState: CheckersGameState,
  squareIndex: number,
): CheckersGameState {
  if (gameState.winner) {
    return gameState;
  }

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
  if (gameState.winner || !canMovePiece(gameState, move.from)) {
    return gameState;
  }

  const nextBoard = applyMove(gameState.board, gameState.currentPlayer, move);

  if (nextBoard === gameState.board) {
    return gameState;
  }

  const winner = getWinner(nextBoard);

  if (winner) {
    return {
      board: nextBoard,
      currentPlayer: gameState.currentPlayer,
      selectedSquareIndex: null,
      legalTargetIndexes: [],
      forcedPieceSquareIndex: null,
      winner,
      statusMessage: `${formatPlayer(winner)} wins`,
    };
  }

  const continuedCaptures = getCapturingMovesForSquare(
    nextBoard,
    move.to,
    gameState.currentPlayer,
  );

  if (continuedCaptures.length > 0) {
    return {
      board: nextBoard,
      currentPlayer: gameState.currentPlayer,
      selectedSquareIndex: move.to,
      legalTargetIndexes: continuedCaptures.map((continuedMove) => continuedMove.to),
      forcedPieceSquareIndex: move.to,
      winner: null,
      statusMessage: `${formatPlayer(gameState.currentPlayer)} must continue capturing`,
    };
  }

  const nextPlayer = getOpponent(gameState.currentPlayer);

  return {
    board: nextBoard,
    currentPlayer: nextPlayer,
    selectedSquareIndex: null,
    legalTargetIndexes: [],
    forcedPieceSquareIndex: null,
    winner: null,
    statusMessage: `${formatPlayer(nextPlayer)} to move`,
  };
}

function getLegalCheckersMoves(gameState: CheckersGameState): Move[] {
  if (gameState.winner) {
    return [];
  }

  if (gameState.forcedPieceSquareIndex !== null) {
    return getLegalMovesForSquare(
      gameState.board,
      gameState.forcedPieceSquareIndex,
      gameState.currentPlayer,
    );
  }

  return getLegalMoves(gameState.board, gameState.currentPlayer);
}

function selectSquare(
  gameState: CheckersGameState,
  squareIndex: number,
): CheckersGameState {
  if (!canMovePiece(gameState, squareIndex)) {
    return gameState;
  }

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

function canMovePiece(
  gameState: CheckersGameState,
  squareIndex: number,
): boolean {
  return (
    gameState.forcedPieceSquareIndex === null ||
    gameState.forcedPieceSquareIndex === squareIndex
  );
}

function formatPlayer(player: string): string {
  return player === "black" ? "Black" : "White";
}
