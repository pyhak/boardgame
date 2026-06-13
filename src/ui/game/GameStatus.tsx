import { useState } from "react";
import type { LocalAiDifficulty } from "../../ai/LocalCheckersAiOpponent";
import type { GameMode } from "./PlayerControls";

interface GameStatusProps {
  statusMessage: string;
  mode: GameMode;
  difficulty: LocalAiDifficulty;
  timerLabel: string;
  currentPlayer: "black" | "white";
  winner: "black" | "white" | null;
  forcedPieceSquareIndex: number | null;
  selectedSquareIndex: number | null;
  legalTargetCount: number;
}

export function GameStatus({
  statusMessage,
  mode,
  difficulty,
  timerLabel,
  currentPlayer,
  winner,
  forcedPieceSquareIndex,
  selectedSquareIndex,
  legalTargetCount,
}: GameStatusProps) {
  const [isDebugOpen, setIsDebugOpen] = useState(false);

  return (
    <div className="game-status">
      <p>{statusMessage}</p>
      <dl className="game-status-meta" aria-label="Game status">
        <div>
          <dt>Režiim</dt>
          <dd>{formatMode(mode)}</dd>
        </div>
        <div>
          <dt>AI tase</dt>
          <dd>{formatDifficulty(difficulty)}</dd>
        </div>
        <div>
          <dt>Aeg</dt>
          <dd>{timerLabel}</dd>
        </div>
      </dl>
      <button
        aria-expanded={isDebugOpen}
        className="debug-toggle"
        onClick={() => setIsDebugOpen((current) => !current)}
        type="button"
      >
        Debug
      </button>
      {isDebugOpen ? (
        <dl aria-label="Debug game state" className="debug-state">
          <div>
            <dt>currentPlayer</dt>
            <dd>{currentPlayer}</dd>
          </div>
          <div>
            <dt>winner</dt>
            <dd>{winner ?? "none"}</dd>
          </div>
          <div>
            <dt>forcedPieceSquareIndex</dt>
            <dd>{forcedPieceSquareIndex ?? "none"}</dd>
          </div>
          <div>
            <dt>selectedSquareIndex</dt>
            <dd>{selectedSquareIndex ?? "none"}</dd>
          </div>
          <div>
            <dt>legalTargetIndexes</dt>
            <dd>{legalTargetCount}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

function formatMode(mode: GameMode): string {
  if (mode === "human-vs-local-ai") {
    return "Human vs Local AI";
  }

  return "Human vs Human";
}

function formatDifficulty(difficulty: LocalAiDifficulty): string {
  switch (difficulty) {
    case "algaja":
      return "Algaja";
    case "oskaja":
      return "Oskaja";
    case "meister":
      return "Meister";
  }
}
