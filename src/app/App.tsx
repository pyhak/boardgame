import { useState } from "react";
import { checkersGameService } from "../games/checkers/checkersGameService";
import { BoardView } from "../ui/board/BoardView";
import { GameStatus } from "../ui/game/GameStatus";
import "./styles.css";

export function App() {
  const [gameState, setGameState] = useState(
    checkersGameService.createInitialState,
  );

  function handleSquareClick(squareIndex: number) {
    setGameState((currentState) =>
      checkersGameService.handleSquareClick(currentState, squareIndex),
    );
  }

  return (
    <main className="app-shell">
      <section className="game-area" aria-labelledby="board-title">
        <header className="game-header">
          <h1 id="board-title">boardgame</h1>
          <GameStatus statusMessage={gameState.statusMessage} />
        </header>
        <BoardView
          board={gameState.board}
          legalTargetIndexes={gameState.legalTargetIndexes}
          selectedSquareIndex={gameState.selectedSquareIndex}
          onSquareClick={handleSquareClick}
        />
      </section>
    </main>
  );
}
