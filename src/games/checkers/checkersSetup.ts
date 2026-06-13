import { createEmptyBoardState } from "../../engine/gameEngine";
import type { Player } from "../../engine/gameEngine";
import type {
  CheckersBoardState,
  CheckersGameState,
  CheckersPiece,
} from "./checkersTypes";

const startingRowsByPlayer: Record<Player, number[]> = {
  black: [0, 1, 2],
  white: [5, 6, 7],
};

export function isDarkSquare(row: number, column: number): boolean {
  return (row + column) % 2 === 1;
}

export function createInitialCheckersBoard(): CheckersBoardState {
  const board = createEmptyBoardState<CheckersPiece>();

  return {
    ...board,
    squares: board.squares.map((square) => {
      const { row, column } = square.coordinate;
      const player = getStartingPlayerForRow(row);

      if (player === null || !isDarkSquare(row, column)) {
        return square;
      }

      return {
        ...square,
        piece: {
          id: `${player}-${row}-${column}`,
          player,
          type: "man",
        },
      };
    }),
  };
}

export function createInitialCheckersGameState(): CheckersGameState {
  return {
    board: createInitialCheckersBoard(),
    currentPlayer: "black",
    selectedSquareIndex: null,
    legalTargetIndexes: [],
  };
}

function getStartingPlayerForRow(row: number): Player | null {
  if (startingRowsByPlayer.black.includes(row)) {
    return "black";
  }

  if (startingRowsByPlayer.white.includes(row)) {
    return "white";
  }

  return null;
}
