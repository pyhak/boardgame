import type { BoardState } from "../../engine/gameEngine";
import { SquareView } from "./SquareView";
import "./board.css";

interface BoardViewProps {
  board: BoardState;
}

export function BoardView({ board }: BoardViewProps) {
  return (
    <div
      className="board"
      role="grid"
      aria-label={`Empty ${board.width} by ${board.height} board`}
      style={{
        gridTemplateColumns: `repeat(${board.width}, 1fr)`,
        gridTemplateRows: `repeat(${board.height}, 1fr)`,
      }}
    >
      {board.squares.map((square) => (
        <SquareView key={square.index} square={square} />
      ))}
    </div>
  );
}
