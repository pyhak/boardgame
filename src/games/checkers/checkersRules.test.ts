import { describe, expect, it } from "vitest";
import { createInitialCheckersGameState } from "./checkersSetup";
import { getLegalMoves, isLegalMove } from "./checkersRules";

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
});
