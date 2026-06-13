import type { Piece } from "../../engine/gameEngine";

interface PieceViewProps {
  piece: Piece;
}

export function PieceView({ piece }: PieceViewProps) {
  return (
    <span
      aria-label={`${piece.player} ${piece.type}`}
      className={`piece piece-${piece.player}`}
    />
  );
}
