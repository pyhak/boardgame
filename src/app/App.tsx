import { useEffect, useMemo, useState } from "react";
import { RandomCheckersAiOpponent } from "../ai/RandomCheckersAiOpponent";
import { checkersGameService } from "../games/checkers/checkersGameService";
import type { CheckersMoveRecord } from "../games/checkers/checkersTypes";
import { BoardView } from "../ui/board/BoardView";
import { GameStatus } from "../ui/game/GameStatus";
import { MoveHistory } from "../ui/game/MoveHistory";
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
  const [moveHistory, setMoveHistory] = useState<CheckersMoveRecord[]>([]);
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
        .chooseMove({
          position: gameState,
          player: gameState.currentPlayer,
          legalMoves,
        })
        .then((move) => {
          if (isCancelled || !move) {
            return;
          }

          const result = checkersGameService.applyMoveWithResult(
            gameState,
            move,
          );
          setGameState(result.gameState);
          appendMoveRecord(result.moveRecord);
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

    const result = checkersGameService.handleSquareClickWithResult(
      gameState,
      squareIndex,
    );
    setGameState(result.gameState);
    appendMoveRecord(result.moveRecord);
  }

  function handleReset() {
    setGameState(checkersGameService.reset());
    setMoveHistory([]);
  }

  function appendMoveRecord(moveRecord: CheckersMoveRecord | null) {
    if (!moveRecord) {
      return;
    }

    setMoveHistory((currentHistory) => [...currentHistory, moveRecord]);
  }

  return (
    <main className="app-shell">
      <section className="game-area" aria-labelledby="board-title">
        <header className="game-header">
          <h1 id="board-title">boardgame</h1>
          <GameStatus statusMessage={gameState.statusMessage} />
          <PlayerControls
            mode={gameMode}
            onModeChange={setGameMode}
            onReset={handleReset}
          />
        </header>
        <div className="game-layout">
          <BoardView
            board={gameState.board}
            legalTargetIndexes={gameState.legalTargetIndexes}
            selectedSquareIndex={gameState.selectedSquareIndex}
            onSquareClick={handleSquareClick}
          />
          <MoveHistory moves={moveHistory} />
        </div>
      </section>
    </main>
  );
}
