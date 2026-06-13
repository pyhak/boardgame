import type { BoardPlaceholderSquare } from "./boardPlaceholder";

interface SquareViewProps {
  square: BoardPlaceholderSquare;
}

export function SquareView({ square }: SquareViewProps) {
  const shadeClass = square.isDark ? "square square-dark" : "square square-light";

  return (
    <div
      className={shadeClass}
      role="gridcell"
      aria-label={`row ${square.row + 1}, column ${square.column + 1}`}
    />
  );
}

