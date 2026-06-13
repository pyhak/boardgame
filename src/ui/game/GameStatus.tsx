interface GameStatusProps {
  statusMessage: string;
  currentPlayer: "black" | "white";
  winner: "black" | "white" | null;
  forcedPieceSquareIndex: number | null;
  selectedSquareIndex: number | null;
  legalTargetCount: number;
}

export function GameStatus({
  statusMessage,
  currentPlayer,
  winner,
  forcedPieceSquareIndex,
  selectedSquareIndex,
  legalTargetCount,
}: GameStatusProps) {
  return (
    <div className="game-status">
      <p>{statusMessage}</p>
      <dl aria-label="Debug game state">
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
    </div>
  );
}
