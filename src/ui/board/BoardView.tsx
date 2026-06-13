import type { BoardState } from "../../engine/gameEngine";
import { SquareView } from "./SquareView";
import "./board.css";

interface BoardViewProps {
  board: BoardState;
  legalTargetIndexes?: number[];
  selectedSquareIndex?: number | null;
  onSquareClick?: (squareIndex: number) => void;
}

export function BoardView({
  board,
  legalTargetIndexes = [],
  selectedSquareIndex = null,
  onSquareClick,
}: BoardViewProps) {
  return (
    <div
      className="board"
      role="grid"
      aria-label={`${board.width} by ${board.height} checkers board`}
      style={{
        gridTemplateColumns: `repeat(${board.width}, 1fr)`,
        gridTemplateRows: `repeat(${board.height}, 1fr)`,
      }}
    >
      {board.squares.map((square) => (
        <SquareView
          key={square.index}
          isLegalTarget={legalTargetIndexes.includes(square.index)}
          isSelected={selectedSquareIndex === square.index}
          onClick={onSquareClick}
          square={square}
        />
      ))}
    </div>
  );
}
