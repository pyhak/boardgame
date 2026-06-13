import { getCapturingMovesForSquare, getLegalMoves, getOpponent } from "./checkersRules";
import type { CheckersGameState } from "./checkersTypes";

export function getCheckersGameStateInvariantIssues(
  gameState: CheckersGameState,
): string[] {
  const issues: string[] = [];
  const legalMoves = getLegalMoves(gameState.board, gameState.currentPlayer);
  const forcedPiece =
    gameState.forcedPieceSquareIndex === null
      ? null
      : gameState.board.squares[gameState.forcedPieceSquareIndex]?.piece ?? null;

  if (gameState.winner === null && gameState.forcedPieceSquareIndex === null) {
    if (legalMoves.length === 0) {
      issues.push(
        `currentPlayer ${gameState.currentPlayer} has no legal moves but winner is null`,
      );
    }
  }

  if (gameState.winner === null && gameState.forcedPieceSquareIndex !== null) {
    if (!forcedPiece) {
      issues.push(
        `forcedPieceSquareIndex ${gameState.forcedPieceSquareIndex} does not contain a piece`,
      );
    } else if (forcedPiece.player !== gameState.currentPlayer) {
      issues.push(
        `forcedPieceSquareIndex ${gameState.forcedPieceSquareIndex} does not belong to ${gameState.currentPlayer}`,
      );
    } else {
      const forcedCaptures = getCapturingMovesForSquare(
        gameState.board,
        gameState.forcedPieceSquareIndex,
        gameState.currentPlayer,
      );

      if (forcedCaptures.length === 0) {
        issues.push(
          `forcedPieceSquareIndex ${gameState.forcedPieceSquareIndex} has no legal captures`,
        );
      }
    }
  }

  if (gameState.winner === null && legalMoves.length === 0) {
    const expectedWinner = getOpponent(gameState.currentPlayer);
    issues.push(
      `winner should be ${expectedWinner} when ${gameState.currentPlayer} has no legal moves`,
    );
  }

  return issues;
}

export function normalizeCheckersGameState(
  gameState: CheckersGameState,
): CheckersGameState {
  let nextState = gameState;

  if (nextState.winner === null && nextState.forcedPieceSquareIndex !== null) {
    const forcedPiece =
      nextState.board.squares[nextState.forcedPieceSquareIndex]?.piece ?? null;
    const forcedCaptures =
      forcedPiece?.player === nextState.currentPlayer
        ? getCapturingMovesForSquare(
            nextState.board,
            nextState.forcedPieceSquareIndex,
            nextState.currentPlayer,
          )
        : [];

    if (forcedCaptures.length === 0) {
      nextState = {
        ...nextState,
        selectedSquareIndex: null,
        legalTargetIndexes: [],
        forcedPieceSquareIndex: null,
      };
    }
  }

  const legalMoves = getLegalMoves(nextState.board, nextState.currentPlayer);
  if (nextState.winner === null && legalMoves.length === 0) {
    const winner = getOpponent(nextState.currentPlayer);
    nextState = {
      ...nextState,
      currentPlayer: winner,
      selectedSquareIndex: null,
      legalTargetIndexes: [],
      forcedPieceSquareIndex: null,
      winner,
      statusMessage: `${formatPlayer(winner)} wins`,
    };
  }

  if (nextState.winner !== null) {
    nextState = {
      ...nextState,
      selectedSquareIndex: null,
      legalTargetIndexes: [],
      forcedPieceSquareIndex: null,
      statusMessage: `${formatPlayer(nextState.winner)} wins`,
    };
  }

  return nextState;
}

function formatPlayer(player: string): string {
  return player === "black" ? "Black" : "White";
}
