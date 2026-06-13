import { describe, expect, it } from "vitest";
import { createBoardCoordinate, createEmptyBoardState } from "./board";

describe("createEmptyBoardState", () => {
  it("creates an empty 8x8 board by default", () => {
    const board = createEmptyBoardState();

    expect(board.width).toBe(8);
    expect(board.height).toBe(8);
    expect(board.squares).toHaveLength(64);
    expect(board.squares.every((square) => square.piece === null)).toBe(true);
  });

  it("creates coordinates from square indexes", () => {
    const board = createEmptyBoardState();

    expect(board.squares[0].coordinate).toEqual({ row: 0, column: 0 });
    expect(board.squares[7].coordinate).toEqual({ row: 0, column: 7 });
    expect(board.squares[8].coordinate).toEqual({ row: 1, column: 0 });
    expect(board.squares[63].coordinate).toEqual({ row: 7, column: 7 });
  });

  it("supports non-8x8 board dimensions", () => {
    const board = createEmptyBoardState(10, 10);

    expect(board.squares).toHaveLength(100);
    expect(createBoardCoordinate(99, board.width)).toEqual({
      row: 9,
      column: 9,
    });
  });
});

