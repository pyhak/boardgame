import type { CheckersGameState } from "../games/checkers/checkersTypes";
import type { GameMode } from "../ui/game/PlayerControls";

export function shouldAutoPlayLocalAiTurn(
  gameState: Pick<CheckersGameState, "currentPlayer" | "winner">,
  gameMode: GameMode,
): boolean {
  return gameMode === "human-vs-local-ai" && gameState.currentPlayer === "black" && gameState.winner === null;
}
