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
import type { CheckersGameState, CheckersMoveRecord } from "./checkersTypes";

export interface CheckersMoveResult {
  gameState: CheckersGameState;
  moveRecord: CheckersMoveRecord | null;
}

export interface CheckersGameService {
  createInitialState(): CheckersGameState;
  reset(): CheckersGameState;
  handleSquareClick(
    gameState: CheckersGameState,
    squareIndex: number,
  ): CheckersGameState;
  handleSquareClickWithResult(
    gameState: CheckersGameState,
    squareIndex: number,
  ): CheckersMoveResult;
  getLegalMoves(gameState: CheckersGameState): Move[];
  applyMove(gameState: CheckersGameState, move: Move): CheckersGameState;
  applyMoveWithResult(
    gameState: CheckersGameState,
    move: Move,
  ): CheckersMoveResult;
}

export const checkersGameService: CheckersGameService = {
  createInitialState: createInitialCheckersGameState,
  reset: createInitialCheckersGameState,
  handleSquareClick,
  handleSquareClickWithResult,
  getLegalMoves: getLegalCheckersMoves,
  applyMove: applyCheckersMove,
  applyMoveWithResult: applyCheckersMoveWithResult,
};

function handleSquareClick(
  gameState: CheckersGameState,
  squareIndex: number,
): CheckersGameState {
  return handleSquareClickWithResult(gameState, squareIndex).gameState;
}

function handleSquareClickWithResult(
  gameState: CheckersGameState,
  squareIndex: number,
): CheckersMoveResult {
  if (gameState.winner) {
    return unchanged(gameState);
  }

  const square = gameState.board.squares[squareIndex];
  const isCurrentPlayerPiece =
    square?.piece?.player === gameState.currentPlayer;

  if (gameState.selectedSquareIndex === null) {
    return isCurrentPlayerPiece
      ? stateOnly(selectSquare(gameState, squareIndex))
      : unchanged(gameState);
  }

  if (isCurrentPlayerPiece) {
    return stateOnly(selectSquare(gameState, squareIndex));
  }

  return applyCheckersMoveWithResult(gameState, {
    from: gameState.selectedSquareIndex,
    to: squareIndex,
  });
}

function applyCheckersMove(
  gameState: CheckersGameState,
  move: Move,
): CheckersGameState {
  return applyCheckersMoveWithResult(gameState, move).gameState;
}

function applyCheckersMoveWithResult(
  gameState: CheckersGameState,
  move: Move,
): CheckersMoveResult {
  if (gameState.winner || !canMovePiece(gameState, move.from)) {
    return unchanged(gameState);
  }

  const nextBoard = applyMove(gameState.board, gameState.currentPlayer, move);

  if (nextBoard === gameState.board) {
    return unchanged(gameState);
  }

  const moveRecord = createMoveRecord(gameState, nextBoard, move);
  const winner = getWinner(nextBoard);

  if (winner) {
    return {
      gameState: {
        board: nextBoard,
        currentPlayer: gameState.currentPlayer,
        selectedSquareIndex: null,
        legalTargetIndexes: [],
        forcedPieceSquareIndex: null,
        winner,
        statusMessage: `${formatPlayer(winner)} wins`,
      },
      moveRecord,
    };
  }

  const continuedCaptures = getCapturingMovesForSquare(
    nextBoard,
    move.to,
    gameState.currentPlayer,
  );

  if (continuedCaptures.length > 0) {
    return {
      gameState: {
        board: nextBoard,
        currentPlayer: gameState.currentPlayer,
        selectedSquareIndex: move.to,
        legalTargetIndexes: continuedCaptures.map(
          (continuedMove) => continuedMove.to,
        ),
        forcedPieceSquareIndex: move.to,
        winner: null,
        statusMessage: `${formatPlayer(gameState.currentPlayer)} must continue capturing`,
      },
      moveRecord,
    };
  }

  const nextPlayer = getOpponent(gameState.currentPlayer);

  return {
    gameState: {
      board: nextBoard,
      currentPlayer: nextPlayer,
      selectedSquareIndex: null,
      legalTargetIndexes: [],
      forcedPieceSquareIndex: null,
      winner: null,
      statusMessage: `${formatPlayer(nextPlayer)} to move`,
    },
    moveRecord,
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

function createMoveRecord(
  previousState: CheckersGameState,
  nextBoard: CheckersGameState["board"],
  move: Move,
): CheckersMoveRecord {
  const previousPiece = previousState.board.squares[move.from].piece;
  const nextPiece = nextBoard.squares[move.to].piece;

  return {
    player: previousState.currentPlayer,
    from: move.from,
    to: move.to,
    captures: findCapturedIndexes(previousState, nextBoard),
    promotion: previousPiece?.type === "man" && nextPiece?.type === "king",
  };
}

function findCapturedIndexes(
  previousState: CheckersGameState,
  nextBoard: CheckersGameState["board"],
): number[] {
  return previousState.board.squares
    .filter(
      (square) =>
        square.piece?.player !== previousState.currentPlayer &&
        square.piece !== null &&
        nextBoard.squares[square.index].piece === null,
    )
    .map((square) => square.index);
}

function unchanged(gameState: CheckersGameState): CheckersMoveResult {
  return {
    gameState,
    moveRecord: null,
  };
}

function stateOnly(gameState: CheckersGameState): CheckersMoveResult {
  return {
    gameState,
    moveRecord: null,
  };
}
