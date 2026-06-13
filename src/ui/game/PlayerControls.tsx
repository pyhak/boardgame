export type GameMode = "human-vs-human" | "human-vs-random-ai";

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
      </div>
      <button onClick={onReset} type="button">
        New Game
      </button>
    </div>
  );
}

function formatMode(mode: GameMode): string {
  return mode === "human-vs-human" ? "Human vs Human" : "Human vs Random AI";
}
