import { describe, expect, it } from "vitest";
import { createEmptyBoardState } from "../../engine/gameEngine";
import { createInitialCheckersGameState } from "./checkersSetup";
import {
  getCheckersGameStateInvariantIssues,
  normalizeCheckersGameState,
} from "./checkersStateInvariant";
import type { CheckersBoardState, CheckersGameState, CheckersPiece } from "./checkersTypes";

describe("checkers state invariant", () => {
  it("accepts a normal initial state", () => {
    expect(getCheckersGameStateInvariantIssues(createInitialCheckersGameState())).toEqual([]);
  });

  it("flags a stale forced square and clears it during normalization", () => {
    const state = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
      ]),
    );
    const invalidState = {
      ...state,
      forcedPieceSquareIndex: 24,
    };

    expect(getCheckersGameStateInvariantIssues(invalidState)).toEqual([
      "forcedPieceSquareIndex 24 does not contain a piece",
    ]);
    expect(normalizeCheckersGameState(invalidState).forcedPieceSquareIndex).toBeNull();
  });

  it("requires a winner when the current player has no legal moves", () => {
    const state = createGameState(
      createBoardWithPieces([
        [1, { id: "white-1", player: "white", type: "man" }],
      ]),
      "black",
    );

    expect(getCheckersGameStateInvariantIssues(state)).toEqual([
      "currentPlayer black has no legal moves but winner is null",
      "winner should be white when black has no legal moves",
    ]);
    expect(normalizeCheckersGameState(state).winner).toBe("white");
  });
});

function createGameState(
  board: CheckersBoardState,
  currentPlayer: CheckersGameState["currentPlayer"] = "black",
): CheckersGameState {
  return {
    board,
    currentPlayer,
    selectedSquareIndex: null,
    legalTargetIndexes: [],
    forcedPieceSquareIndex: null,
    winner: null,
    statusMessage: currentPlayer === "black" ? "Black to move" : "White to move",
  };
}

function createBoardWithPieces(
  pieces: Array<[number, CheckersPiece]>,
): CheckersBoardState {
  const board = createEmptyBoardState<CheckersPiece>();
  const piecesByIndex = new Map(pieces);

  return {
    ...board,
    squares: board.squares.map((square) => ({
      ...square,
      piece: piecesByIndex.get(square.index) ?? null,
    })),
  };
}
