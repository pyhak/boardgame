import { describe, expect, it } from "vitest";
import { createEmptyBoardSquares } from "./boardPlaceholder";

describe("createEmptyBoardSquares", () => {
  it("creates an empty 8x8 board placeholder", () => {
    const squares = createEmptyBoardSquares(8);

    expect(squares).toHaveLength(64);
    expect(squares[0]).toMatchObject({ row: 0, column: 0, isDark: false });
    expect(squares[63]).toMatchObject({ row: 7, column: 7, isDark: false });
  });
});

