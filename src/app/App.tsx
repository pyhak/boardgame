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
import { GameFinishOverlay } from "../ui/game/GameFinishOverlay";
import { GameSetupDialog } from "../ui/game/GameSetupDialog";
import { GameStatus } from "../ui/game/GameStatus";
import { MoveHistory } from "../ui/game/MoveHistory";
import {
  PlayerControls,
  type GameMode,
} from "../ui/game/PlayerControls";
import { shouldAutoPlayLocalAiTurn } from "./appLogic";
import {
  createGameResult,
  createInitialGameSession,
  finishGameSession,
  formatElapsedTime,
  getElapsedSeconds,
  shouldRunGameTimer,
  startGameSession,
  type GameSession,
} from "./gameSession";
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
  const [session, setSession] = useState<GameSession>(
    () => createInitialGameSession(),
  );
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const {
    startedAtMs,
    finishedAtMs,
    playerName,
    gameResult,
    isSetupOpen,
    isResultVisible,
  } = session;

  const localAiOpponent = useMemo(
    () => new LocalCheckersAiOpponent(localAiDifficulty),
    [localAiDifficulty],
  );

  const appendMoveRecord = useCallback(
    (moveRecord: CheckersMoveRecord | null, actor: CheckersMoveActor) => {
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

  const isGameActive = startedAtMs !== null && finishedAtMs === null;
  const isAiTurn =
    isGameActive && shouldAutoPlayLocalAiTurn(gameState, gameMode);
  const elapsedSeconds = getElapsedSeconds({ startedAtMs, finishedAtMs }, clockNowMs);
  const elapsedLabel = formatElapsedTime(elapsedSeconds);

  useEffect(() => {
    if (!shouldRunGameTimer({ startedAtMs, finishedAtMs })) {
      return;
    }

    const timerId = window.setInterval(() => {
      setClockNowMs(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, [finishedAtMs, startedAtMs]);

  useEffect(() => {
    if (!isGameActive || gameState.winner === null || gameResult) {
      return;
    }

    const completedAt = Date.now();
    const completedGameResult = createGameResult({
      playerName,
      winner: gameState.winner,
      elapsedSeconds: getElapsedSeconds(
        { startedAtMs, finishedAtMs },
        completedAt,
      ),
      completedAt: new Date(completedAt).toISOString(),
      moveCount: moveHistory.length,
    });

    setSession((currentSession) =>
      finishGameSession(currentSession, completedGameResult, completedAt),
    );
    setClockNowMs(completedAt);
  }, [
    gameState.winner,
    isGameActive,
    playerName,
    startedAtMs,
    finishedAtMs,
    moveHistory.length,
    gameResult,
  ]);

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
    if (!isGameActive || isAiTurn) {
      return;
    }

    const result = checkersGameService.handleSquareClickWithResult(
      gameState,
      squareIndex,
    );
    setGameState(result.gameState);
    appendMoveRecord(result.moveRecord, "human");
  }

  function handleStartGame() {
    const now = Date.now();

    setSession((currentSession) => startGameSession(currentSession, now));
    setGameState(checkersGameService.reset());
    setMoveHistory([]);
    setClockNowMs(now);
  }

  function handleNewGame() {
    setSession((currentSession) => {
      const nextSession: GameSession = {
        ...createInitialGameSession(currentSession.playerName),
        playerNameInput: currentSession.playerName,
        playerName: currentSession.playerName,
      };

      return nextSession;
    });
    setGameState(checkersGameService.reset());
    setMoveHistory([]);
    setClockNowMs(Date.now());
  }

  function handleViewBoard() {
    setSession((currentSession) => ({
      ...currentSession,
      isResultVisible: false,
    }));
  }

  function handleModeChange(mode: GameMode) {
    setGameMode(mode);
  }

  function handleDifficultyChange(difficulty: LocalAiDifficulty) {
    setLocalAiDifficulty(difficulty);
  }

  function handlePlayerNameChange(playerName: string) {
    setSession((currentSession) => ({
      ...currentSession,
      playerNameInput: playerName,
    }));
  }

  return (
    <main className="app-shell">
      <section className="game-area" aria-labelledby="board-title">
        <header className="game-header">
          <h1 id="board-title">boardgame</h1>
          <GameStatus
            statusMessage={gameState.statusMessage}
            mode={gameMode}
            difficulty={localAiDifficulty}
            timerLabel={isGameActive ? elapsedLabel : "00:00:00"}
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
            onReset={handleNewGame}
          />
        </header>
        <div className="game-layout">
          <div className="board-stage">
            <BoardView
              board={gameState.board}
              legalTargetIndexes={gameState.legalTargetIndexes}
              selectedSquareIndex={gameState.selectedSquareIndex}
              onSquareClick={handleSquareClick}
            />
            {isSetupOpen ? (
              <GameSetupDialog
                playerName={session.playerNameInput}
                onPlayerNameChange={handlePlayerNameChange}
                onStartGame={handleStartGame}
              />
            ) : null}
            {isResultVisible && gameState.winner ? (
              <GameFinishOverlay
                elapsedLabel={elapsedLabel}
                mode={gameMode}
                onNewGame={handleNewGame}
                onViewBoard={handleViewBoard}
                playerName={playerName}
                winner={gameState.winner}
              />
            ) : null}
          </div>
          <MoveHistory moves={moveHistory} />
        </div>
      </section>
    </main>
  );
}
