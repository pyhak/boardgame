import { createEmptyBoardState } from "../engine/gameEngine";
import { BoardView } from "../ui/board/BoardView";
import "./styles.css";

const board = createEmptyBoardState();

export function App() {
  return (
    <main className="app-shell">
      <section className="game-area" aria-labelledby="board-title">
        <header className="game-header">
          <h1 id="board-title">boardgame</h1>
          <p>Empty 8x8 board placeholder</p>
        </header>
        <BoardView board={board} />
      </section>
    </main>
  );
}
