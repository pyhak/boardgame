import { useEffect, useMemo, useState } from "react";
import { OpenAiCheckersOpponent } from "../ai/OpenAiCheckersOpponent";
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
import { formatOpenAiFailureMessage } from "./openAiFailureMessage";
import "./styles.css";

const aiMoveDelayMs = 400;

export function App() {
  const [gameState, setGameState] = useState(
    checkersGameService.createInitialState,
  );
  const [moveHistory, setMoveHistory] = useState<CheckersMoveRecord[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>("human-vs-human");
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);
  const randomAiOpponent = useMemo(() => new RandomCheckersAiOpponent(), []);
  const openAiOpponent = useMemo(() => new OpenAiCheckersOpponent(), []);
  const aiOpponent =
    gameMode === "human-vs-openai-ai" ? openAiOpponent : randomAiOpponent;
  const isAiTurn =
    (gameMode === "human-vs-random-ai" ||
      gameMode === "human-vs-openai-ai") &&
    gameState.currentPlayer === "black" &&
    !gameState.winner;

  useEffect(() => {
    if (!isAiTurn) {
      return;
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      const legalMoves = checkersGameService.getLegalMoves(gameState);

      console.info("Starting AI turn", {
        mode: gameMode,
        player: gameState.currentPlayer,
        legalMoveCount: legalMoves.length,
        forcedPieceSquareIndex: gameState.forcedPieceSquareIndex,
        winner: gameState.winner,
      });

      void aiOpponent
        .chooseMove({
          position: gameState,
          player: gameState.currentPlayer,
          legalMoves,
        })
        .then((move) => {
          if (isCancelled || !move) {
            console.warn("AI turn produced no move", {
              mode: gameMode,
              player: gameState.currentPlayer,
              legalMoveCount: legalMoves.length,
              forcedPieceSquareIndex: gameState.forcedPieceSquareIndex,
              winner: gameState.winner,
              cancelled: isCancelled,
            });
            if (!isCancelled && gameMode === "human-vs-openai-ai") {
              setAiErrorMessage(
                "OpenAI AI ei saanud praegu käiku teha.",
              );
            }
            return;
          }

          console.info("Applying AI move", {
            mode: gameMode,
            player: gameState.currentPlayer,
            from: move.from,
            to: move.to,
            captures: move.captures?.length ?? 0,
            promotion: Boolean(move.promotion),
          });

          const result = checkersGameService.applyMoveWithResult(
            gameState,
            move,
          );
          setAiErrorMessage(null);
          setGameState(result.gameState);
          appendMoveRecord(result.moveRecord);
        })
        .catch((error: unknown) => {
          // The proxy can be offline or return a safe fallback; keep the board unchanged.
          if (!isCancelled && gameMode === "human-vs-openai-ai") {
            console.warn("OpenAI AI move request failed; board unchanged.", {
              mode: gameMode,
              player: gameState.currentPlayer,
              legalMoveCount: legalMoves.length,
              forcedPieceSquareIndex: gameState.forcedPieceSquareIndex,
              winner: gameState.winner,
              error:
                error instanceof Error ? error.message : "Unknown OpenAI error",
            });
            setAiErrorMessage(formatOpenAiFailureMessage(error));
          }
        });
    }, aiMoveDelayMs);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [aiOpponent, gameMode, gameState, isAiTurn]);

  function handleSquareClick(squareIndex: number) {
    if (isAiTurn) {
      return;
    }

    const result = checkersGameService.handleSquareClickWithResult(
      gameState,
      squareIndex,
    );
    setAiErrorMessage(null);
    setGameState(result.gameState);
    appendMoveRecord(result.moveRecord);
  }

  function handleReset() {
    setGameState(checkersGameService.reset());
    setMoveHistory([]);
    setAiErrorMessage(null);
  }

  function handleModeChange(mode: GameMode) {
    setGameMode(mode);
    setAiErrorMessage(null);
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
          <GameStatus statusMessage={aiErrorMessage ?? gameState.statusMessage} />
          <PlayerControls
            mode={gameMode}
            onModeChange={handleModeChange}
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
