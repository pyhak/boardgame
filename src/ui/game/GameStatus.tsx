import type { Player } from "../../engine/gameEngine";

interface GameStatusProps {
  currentPlayer: Player;
}

export function GameStatus({ currentPlayer }: GameStatusProps) {
  return <p>{currentPlayer === "black" ? "Black" : "White"} to move</p>;
}
