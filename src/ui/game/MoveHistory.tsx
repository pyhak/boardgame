import type { CheckersMoveRecord } from "../../games/checkers/checkersTypes";

interface MoveHistoryProps {
  moves: CheckersMoveRecord[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
  return (
    <aside className="move-history" aria-label="Move history">
      <h2>Move history</h2>
      {moves.length === 0 ? (
        <p>No moves yet</p>
      ) : (
        <ol>
          {moves.map((move, index) => (
            <li key={`${move.player}-${move.from}-${move.to}-${index}`}>
              <span>{formatPlayer(move.player)}</span>
              <span>
                {formatSquare(move.from)} to {formatSquare(move.to)}
              </span>
              {move.captures.length > 0 ? <strong>capture</strong> : null}
              {move.promotion ? <strong>king</strong> : null}
              {move.comment ? <span className="move-comment">{move.comment}</span> : null}
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function formatPlayer(player: CheckersMoveRecord["player"]): string {
  return player === "black" ? "Black" : "White";
}

function formatSquare(index: number): string {
  const row = Math.floor(index / 8);
  const column = index % 8;
  return `${String.fromCharCode(97 + column)}${8 - row}`;
}
