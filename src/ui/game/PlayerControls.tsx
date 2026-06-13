export type GameMode = "human-vs-human" | "human-vs-random-ai";

interface PlayerControlsProps {
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
}

export function PlayerControls({ mode, onModeChange }: PlayerControlsProps) {
  return (
    <div className="player-controls" aria-label="Game mode">
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
  );
}
