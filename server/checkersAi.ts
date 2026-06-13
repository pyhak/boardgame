import type { Move, Player } from "../src/engine/types";

export interface CompactCheckersPiece {
  index: number;
  player: Player;
  type: string;
}

export interface CheckersAiMoveRequest {
  position: {
    pieces: CompactCheckersPiece[];
    forcedPieceSquareIndex: number | null;
    winner: Player | null;
  };
  currentPlayer: Player;
  legalMoves: Move[];
}

export interface CheckersAiMoveResponse {
  move: Move | null;
  selectedIndex: number | null;
  fallback: boolean;
  error?: string;
}

export interface OpenAiMoveClient {
  chooseMoveIndex(input: CheckersAiMoveRequest): Promise<number>;
}

export function isCheckersAiMoveRequest(
  value: unknown,
): value is CheckersAiMoveRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isCompactPosition(value.position) &&
    isPlayer(value.currentPlayer) &&
    Array.isArray(value.legalMoves) &&
    value.legalMoves.every(isMove)
  );
}

export function selectLegalMoveByIndex(
  legalMoves: Move[],
  selectedIndex: number,
): Move | null {
  if (!Number.isInteger(selectedIndex)) {
    return null;
  }

  return legalMoves[selectedIndex] ?? null;
}

export async function chooseCheckersAiMove(
  request: CheckersAiMoveRequest,
  openAiClient: OpenAiMoveClient,
): Promise<CheckersAiMoveResponse> {
  if (request.legalMoves.length === 0 || request.position.winner) {
    return {
      move: null,
      selectedIndex: null,
      fallback: true,
      error: "No legal AI move is available.",
    };
  }

  try {
    const selectedIndex = await openAiClient.chooseMoveIndex(request);
    const move = selectLegalMoveByIndex(request.legalMoves, selectedIndex);

    if (!move) {
      return {
        move: null,
        selectedIndex,
        fallback: true,
        error: "OpenAI returned an invalid move index.",
      };
    }

    return {
      move,
      selectedIndex,
      fallback: false,
    };
  } catch {
    return {
      move: null,
      selectedIndex: null,
      fallback: true,
      error: "OpenAI move selection failed.",
    };
  }
}

function isCompactPosition(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    Array.isArray(value.pieces) &&
    value.pieces.every(isCompactPiece) &&
    (typeof value.forcedPieceSquareIndex === "number" ||
      value.forcedPieceSquareIndex === null) &&
    (isPlayer(value.winner) || value.winner === null)
  );
}

function isCompactPiece(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.index === "number" &&
    isPlayer(value.player) &&
    typeof value.type === "string"
  );
}

function isMove(value: unknown): value is Move {
  return (
    isRecord(value) &&
    typeof value.from === "number" &&
    typeof value.to === "number" &&
    (value.captures === undefined ||
      (Array.isArray(value.captures) &&
        value.captures.every((capture) => typeof capture === "number"))) &&
    (value.promotion === undefined || typeof value.promotion === "boolean")
  );
}

function isPlayer(value: unknown): value is Player {
  return value === "black" || value === "white";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
