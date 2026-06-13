import { describe, expect, it } from "vitest";
import { createEmptyBoardState } from "../../engine/gameEngine";
import { createInitialCheckersGameState } from "./checkersSetup";
import {
  applyMove,
  getLegalMoves,
  getWinner,
  isLegalMove,
} from "./checkersRules";
import type { CheckersBoardState, CheckersPiece } from "./checkersTypes";

describe("checkers initial setup", () => {
  it("places 12 pieces for each player", () => {
    const { board } = createInitialCheckersGameState();

    const blackPieces = board.squares.filter(
      (square) => square.piece?.player === "black",
    );
    const whitePieces = board.squares.filter(
      (square) => square.piece?.player === "white",
    );

    expect(blackPieces).toHaveLength(12);
    expect(whitePieces).toHaveLength(12);
  });

  it("places pieces on dark squares in the first and last three rows", () => {
    const { board } = createInitialCheckersGameState();

    expect(board.squares[1].piece?.player).toBe("black");
    expect(board.squares[8].piece?.player).toBe("black");
    expect(board.squares[17].piece?.player).toBe("black");
    expect(board.squares[40].piece?.player).toBe("white");
    expect(board.squares[49].piece?.player).toBe("white");
    expect(board.squares[56].piece?.player).toBe("white");

    expect(board.squares[0].piece).toBeNull();
    expect(board.squares[27].piece).toBeNull();
    expect(board.squares[63].piece).toBeNull();
  });
});

describe("checkers simple movement", () => {
  it("allows regular black pieces to move one row forward diagonally", () => {
    const { board } = createInitialCheckersGameState();

    expect(getLegalMoves(board, "black")).toEqual(
      expect.arrayContaining([
        { from: 17, to: 24 },
        { from: 17, to: 26 },
      ]),
    );
  });

  it("allows regular white pieces to move one row forward diagonally", () => {
    const { board } = createInitialCheckersGameState();

    expect(getLegalMoves(board, "white")).toEqual(
      expect.arrayContaining([
        { from: 42, to: 33 },
        { from: 42, to: 35 },
      ]),
    );
  });

  it("rejects backward moves for regular pieces", () => {
    const { board } = createInitialCheckersGameState();

    expect(isLegalMove(board, "black", { from: 17, to: 10 })).toBe(false);
    expect(isLegalMove(board, "white", { from: 40, to: 49 })).toBe(false);
  });

  it("finds legal forward captures", () => {
    const board = createBoardWithPieces([
      [17, { id: "black-17", player: "black", type: "man" }],
      [26, { id: "white-26", player: "white", type: "man" }],
    ]);

    expect(getLegalMoves(board, "black")).toEqual([
      { from: 17, to: 35, captures: [26] },
    ]);
  });

  it("removes captured pieces when applying a capture", () => {
    const board = createBoardWithPieces([
      [17, { id: "black-17", player: "black", type: "man" }],
      [26, { id: "white-26", player: "white", type: "man" }],
    ]);
    const nextBoard = applyMove(board, "black", { from: 17, to: 35 });

    expect(nextBoard.squares[17].piece).toBeNull();
    expect(nextBoard.squares[26].piece).toBeNull();
    expect(nextBoard.squares[35].piece?.player).toBe("black");
  });

  it("makes non-capturing moves illegal when a capture is available", () => {
    const board = createBoardWithPieces([
      [17, { id: "black-17", player: "black", type: "man" }],
      [21, { id: "black-21", player: "black", type: "man" }],
      [26, { id: "white-26", player: "white", type: "man" }],
    ]);

    expect(getLegalMoves(board, "black")).toEqual([
      { from: 17, to: 35, captures: [26] },
    ]);
    expect(isLegalMove(board, "black", { from: 21, to: 28 })).toBe(false);
  });
});

describe("checkers win detection", () => {
  it("detects a win when the opponent has no pieces", () => {
    const board = createBoardWithPieces([
      [17, { id: "black-17", player: "black", type: "man" }],
    ]);

    expect(getWinner(board)).toBe("black");
  });

  it("detects a win when the opponent has no legal moves", () => {
    const board = createBoardWithPieces([
      [17, { id: "black-17", player: "black", type: "man" }],
      [1, { id: "white-1", player: "white", type: "man" }],
    ]);

    expect(getWinner(board)).toBe("black");
  });
});

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
