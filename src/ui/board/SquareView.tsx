import type { BoardSquare } from "../../engine/gameEngine";
import { PieceView } from "./PieceView";

interface SquareViewProps {
  square: BoardSquare;
  isLegalTarget?: boolean;
  isSelected?: boolean;
  onClick?: (squareIndex: number) => void;
}

export function SquareView({
  square,
  isLegalTarget = false,
  isSelected = false,
  onClick,
}: SquareViewProps) {
  const { row, column } = square.coordinate;
  const isDark = (row + column) % 2 === 1;
  const shadeClass = isDark ? "square-dark" : "square-light";
  const stateClasses = [
    isSelected ? "square-selected" : "",
    isLegalTarget ? "square-legal-target" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={`square ${shadeClass} ${stateClasses}`}
      onClick={() => onClick?.(square.index)}
      role="gridcell"
      aria-label={`row ${row + 1}, column ${column + 1}`}
      type="button"
    >
      {square.piece ? <PieceView piece={square.piece} /> : null}
    </button>
  );
}
