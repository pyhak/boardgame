import type { BoardCoordinate, BoardSquare, BoardState, Piece } from "./types";

export const defaultBoardSize = 8;

export function createBoardCoordinate(
  index: number,
  width: number,
): BoardCoordinate {
  return {
    row: Math.floor(index / width),
    column: index % width,
  };
}

export function createBoardSquare<TPiece extends Piece = Piece>(
  index: number,
  width: number,
): BoardSquare<TPiece> {
  return {
    index,
    coordinate: createBoardCoordinate(index, width),
    piece: null,
  };
}

export function createEmptyBoardState<TPiece extends Piece = Piece>(
  width = defaultBoardSize,
  height = defaultBoardSize,
): BoardState<TPiece> {
  return {
    width,
    height,
    squares: Array.from({ length: width * height }, (_, index) =>
      createBoardSquare<TPiece>(index, width),
    ),
  };
}

