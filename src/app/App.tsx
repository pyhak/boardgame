import { useMemo, useState } from "react";
import {
  applyCheckersMove,
  getLegalMovesForSquare,
} from "../games/checkers/checkersRules";
import { createInitialCheckersGameState } from "../games/checkers/checkersSetup";
import { BoardView } from "../ui/board/BoardView";
import { GameStatus } from "../ui/game/GameStatus";
import "./styles.css";

export function App() {
  const [gameState, setGameState] = useState(createInitialCheckersGameState);
  const [selectedSquareIndex, setSelectedSquareIndex] = useState<number | null>(
    null,
  );

  const legalTargetIndexes = useMemo(() => {
    if (selectedSquareIndex === null) {
      return [];
    }

    return getLegalMovesForSquare(
      gameState.board,
      selectedSquareIndex,
      gameState.currentPlayer,
    ).map((move) => move.to);
  }, [gameState, selectedSquareIndex]);

  function handleSquareClick(squareIndex: number) {
    const square = gameState.board.squares[squareIndex];
    const isCurrentPlayerPiece =
      square.piece?.player === gameState.currentPlayer;

    if (selectedSquareIndex === null) {
      if (isCurrentPlayerPiece) {
        setSelectedSquareIndex(squareIndex);
      }

      return;
    }

    if (isCurrentPlayerPiece) {
      setSelectedSquareIndex(squareIndex);
      return;
    }

    const nextGameState = applyCheckersMove(gameState, {
      from: selectedSquareIndex,
      to: squareIndex,
    });

    if (nextGameState !== gameState) {
      setGameState(nextGameState);
      setSelectedSquareIndex(null);
    }
  }

  return (
    <main className="app-shell">
      <section className="game-area" aria-labelledby="board-title">
        <header className="game-header">
          <h1 id="board-title">boardgame</h1>
          <GameStatus currentPlayer={gameState.currentPlayer} />
        </header>
        <BoardView
          board={gameState.board}
          legalTargetIndexes={legalTargetIndexes}
          selectedSquareIndex={selectedSquareIndex}
          onSquareClick={handleSquareClick}
        />
      </section>
    </main>
  );
}
