import { useEffect, useMemo, useState } from "react";
import { RandomCheckersAiOpponent } from "../ai/RandomCheckersAiOpponent";
import { checkersGameService } from "../games/checkers/checkersGameService";
import { BoardView } from "../ui/board/BoardView";
import { GameStatus } from "../ui/game/GameStatus";
import {
  PlayerControls,
  type GameMode,
} from "../ui/game/PlayerControls";
import "./styles.css";

const aiMoveDelayMs = 400;

export function App() {
  const [gameState, setGameState] = useState(
    checkersGameService.createInitialState,
  );
  const [gameMode, setGameMode] = useState<GameMode>("human-vs-human");
  const randomAiOpponent = useMemo(() => new RandomCheckersAiOpponent(), []);
  const isRandomAiTurn =
    gameMode === "human-vs-random-ai" &&
    gameState.currentPlayer === "black" &&
    !gameState.winner;

  useEffect(() => {
    if (!isRandomAiTurn) {
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      const legalMoves = checkersGameService.getLegalMoves(gameState);

      void randomAiOpponent
        .chooseMove({ gameState, legalMoves })
        .then((move) => {
          if (isCancelled || !move) {
            return;
          }

          setGameState((latestState) => {
            if (
              gameMode !== "human-vs-random-ai" ||
              latestState.currentPlayer !== "black" ||
              latestState.winner
            ) {
              return latestState;
            }

            return checkersGameService.applyMove(latestState, move);
          });
        });
    }, aiMoveDelayMs);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [gameMode, gameState, isRandomAiTurn, randomAiOpponent]);

  function handleSquareClick(squareIndex: number) {
    if (isRandomAiTurn) {
      return;
    }

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
          <PlayerControls mode={gameMode} onModeChange={setGameMode} />
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
