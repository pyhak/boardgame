export type GameMode =
  | "human-vs-human"
  | "human-vs-random-ai"
  | "human-vs-openai-ai";

interface PlayerControlsProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  onReset: () => void;
}

export function PlayerControls({
  mode,
  onModeChange,
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
            checked={mode === "human-vs-random-ai"}
            name="game-mode"
            onChange={() => onModeChange("human-vs-random-ai")}
            type="radio"
          />
          Human vs Random AI
        </label>
        <label>
          <input
            checked={mode === "human-vs-openai-ai"}
            name="game-mode"
            onChange={() => onModeChange("human-vs-openai-ai")}
            type="radio"
          />
          Human vs OpenAI AI
        </label>
      </div>
      <button onClick={onReset} type="button">
        New Game
      </button>
    </div>
  );
}

function formatMode(mode: GameMode): string {
  if (mode === "human-vs-random-ai") {
    return "Human vs Random AI";
  }

  if (mode === "human-vs-openai-ai") {
    return "Human vs OpenAI AI";
  }

  return "Human vs Human";
}
