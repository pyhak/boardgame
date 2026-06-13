import type { LocalAiDifficulty } from "../../ai/LocalCheckersAiOpponent";

export type GameMode = "human-vs-human" | "human-vs-local-ai";

interface PlayerControlsProps {
  mode: GameMode;
  difficulty: LocalAiDifficulty;
  onModeChange: (mode: GameMode) => void;
  onDifficultyChange: (difficulty: LocalAiDifficulty) => void;
  onReset: () => void;
}

export function PlayerControls({
  mode,
  difficulty,
  onModeChange,
  onDifficultyChange,
  onReset,
}: PlayerControlsProps) {
  return (
    <div className="player-controls">
      <p>Mode: {formatMode(mode)}</p>
      <div className="mode-options" aria-label="Game mode">
        <label>
          <input
            checked={mode === "human-vs-human"}
            name="game-mode"
            onChange={() => onModeChange("human-vs-human")}
            type="radio"
          />
          Human vs Human
        </label>
        <label>
          <input
            checked={mode === "human-vs-local-ai"}
            name="game-mode"
            onChange={() => onModeChange("human-vs-local-ai")}
            type="radio"
          />
          Human vs Local AI
        </label>
      </div>
      <label className="difficulty-picker">
        AI difficulty
        <select
          disabled={mode !== "human-vs-local-ai"}
          onChange={(event) =>
            onDifficultyChange(event.target.value as LocalAiDifficulty)
          }
          value={difficulty}
        >
          <option value="algaja">Algaja</option>
          <option value="oskaja">Oskaja</option>
          <option value="meister">Meister</option>
        </select>
      </label>
      <button onClick={onReset} type="button">
        Uus mäng
      </button>
    </div>
  );
}

function formatMode(mode: GameMode): string {
  if (mode === "human-vs-local-ai") {
    return "Human vs Local AI";
  }

  return "Human vs Human";
}
