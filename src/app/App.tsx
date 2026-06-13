import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LocalCheckersAiOpponent,
  type LocalAiDifficulty,
} from "../ai/LocalCheckersAiOpponent";
import { checkersGameService } from "../games/checkers/checkersGameService";
import {
  buildCheckersMoveComment,
  type CheckersMoveActor,
} from "../games/checkers/checkersCommentary";
import type { CheckersMoveRecord } from "../games/checkers/checkersTypes";
import { BoardView } from "../ui/board/BoardView";
import { GameStatus } from "../ui/game/GameStatus";
import { MoveHistory } from "../ui/game/MoveHistory";
import {
  PlayerControls,
  type GameMode,
} from "../ui/game/PlayerControls";
import { shouldAutoPlayLocalAiTurn } from "./appLogic";
import "./styles.css";

const aiMoveDelayMs = 400;
const aiPlayer = "black";

export function App() {
  const [gameState, setGameState] = useState(
    checkersGameService.createInitialState,
  );
  const [moveHistory, setMoveHistory] = useState<CheckersMoveRecord[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>("human-vs-local-ai");
  const [localAiDifficulty, setLocalAiDifficulty] =
    useState<LocalAiDifficulty>("oskaja");
  const localAiOpponent = useMemo(
    () => new LocalCheckersAiOpponent(localAiDifficulty),
    [localAiDifficulty],
  );
  const appendMoveRecord = useCallback(
    (
      moveRecord: CheckersMoveRecord | null,
      actor: CheckersMoveActor,
    ) => {
      if (!moveRecord) {
        return;
      }

      const comment =
        gameMode === "human-vs-local-ai"
          ? buildCheckersMoveComment(moveRecord, aiPlayer, actor)
          : null;

      setMoveHistory((currentHistory) => [
        ...currentHistory,
        {
          ...moveRecord,
          comment,
        },
      ]);
    },
    [gameMode],
  );
  const isAiTurn = shouldAutoPlayLocalAiTurn(gameState, gameMode);

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
        difficulty: localAiDifficulty,
      });

      void localAiOpponent
        .chooseMove({
          position: gameState,
          player: gameState.currentPlayer,
          legalMoves,
          history: moveHistory.map((move) => ({
            player: move.player,
            move: {
              from: move.from,
              to: move.to,
              captures: move.captures,
              promotion: move.promotion,
            },
          })),
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
          setGameState(result.gameState);
          appendMoveRecord(result.moveRecord, "ai");
        })
        .catch((error: unknown) => {
          if (!isCancelled) {
            console.warn("Local AI move request failed; board unchanged.", {
              mode: gameMode,
              player: gameState.currentPlayer,
              legalMoveCount: legalMoves.length,
              forcedPieceSquareIndex: gameState.forcedPieceSquareIndex,
              winner: gameState.winner,
              difficulty: localAiDifficulty,
              error:
                error instanceof Error ? error.message : "Unknown local AI error",
            });
          }
        });
    }, aiMoveDelayMs);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    appendMoveRecord,
    gameMode,
    gameState,
    isAiTurn,
    localAiDifficulty,
    localAiOpponent,
    moveHistory,
  ]);

  function handleSquareClick(squareIndex: number) {
    if (isAiTurn) {
      return;
    }

    const result = checkersGameService.handleSquareClickWithResult(
      gameState,
      squareIndex,
    );
    setGameState(result.gameState);
    appendMoveRecord(result.moveRecord, "human");
  }

  function handleReset() {
    setGameState(checkersGameService.reset());
    setMoveHistory([]);
  }

  function handleModeChange(mode: GameMode) {
    setGameMode(mode);
  }

  function handleDifficultyChange(difficulty: LocalAiDifficulty) {
    setLocalAiDifficulty(difficulty);
  }

  return (
    <main className="app-shell">
      <section className="game-area" aria-labelledby="board-title">
        <header className="game-header">
          <h1 id="board-title">boardgame</h1>
          <GameStatus
            statusMessage={gameState.statusMessage}
            currentPlayer={gameState.currentPlayer}
            winner={gameState.winner}
            forcedPieceSquareIndex={gameState.forcedPieceSquareIndex}
            selectedSquareIndex={gameState.selectedSquareIndex}
            legalTargetCount={gameState.legalTargetIndexes.length}
          />
          <PlayerControls
            mode={gameMode}
            difficulty={localAiDifficulty}
            onModeChange={handleModeChange}
            onDifficultyChange={handleDifficultyChange}
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
