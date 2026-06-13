export interface BoardPlaceholderSquare {
  index: number;
  row: number;
  column: number;
  isDark: boolean;
}

export function createEmptyBoardSquares(size: number): BoardPlaceholderSquare[] {
  return Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const column = index % size;

    return {
      index,
      row,
      column,
      isDark: (row + column) % 2 === 1,
    };
  });
}

