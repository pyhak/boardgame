import { createEmptyBoardSquares } from "./boardPlaceholder";
import { SquareView } from "./SquareView";
import "./board.css";

const boardSquares = createEmptyBoardSquares(8);

export function BoardView() {
  return (
    <div className="board" role="grid" aria-label="Empty 8 by 8 board">
      {boardSquares.map((square) => (
        <SquareView key={square.index} square={square} />
      ))}
    </div>
  );
}

