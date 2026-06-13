import type { BoardSquare } from "../../engine/gameEngine";

interface SquareViewProps {
  square: BoardSquare;
}

export function SquareView({ square }: SquareViewProps) {
  const { row, column } = square.coordinate;
  const isDark = (row + column) % 2 === 1;
  const shadeClass = isDark ? "square square-dark" : "square square-light";

  return (
    <div
      className={shadeClass}
      role="gridcell"
      aria-label={`row ${row + 1}, column ${column + 1}`}
    />
  );
}
