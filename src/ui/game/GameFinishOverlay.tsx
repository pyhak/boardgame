import type { Player } from "../../engine/gameEngine";
import type { GameMode } from "./PlayerControls";

interface GameFinishOverlayProps {
  winner: Player;
  playerName: string;
  elapsedLabel: string;
  mode: GameMode;
  onNewGame: () => void;
  onViewBoard: () => void;
}

export function GameFinishOverlay({
  winner,
  playerName,
  elapsedLabel,
  mode,
  onNewGame,
  onViewBoard,
}: GameFinishOverlayProps) {
  const title = getWinnerTitle(winner, mode, playerName);

  return (
    <section className="game-overlay" aria-label="Game finished">
      <div className="game-overlay-card">
        <p className="game-overlay-title">{title}</p>
        <p>Aeg: {elapsedLabel}</p>
        <div className="game-overlay-actions">
          <button onClick={onNewGame} type="button">
            Uus mäng
          </button>
          <button onClick={onViewBoard} type="button">
            Vaata lauda
          </button>
        </div>
      </div>
    </section>
  );
}

function getWinnerTitle(
  winner: Player,
  mode: GameMode,
  playerName: string,
): string {
  if (mode === "human-vs-local-ai" && winner === "black") {
    return "Must võitis";
  }

  return `${playerName} võitis`;
}
