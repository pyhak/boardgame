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
  console.info("Selecting checkers AI move", {
    currentPlayer: request.currentPlayer,
    legalMoveCount: request.legalMoves.length,
    forcedPieceSquareIndex: request.position.forcedPieceSquareIndex,
    winner: request.position.winner,
  });

  if (request.legalMoves.length === 0 || request.position.winner) {
    console.warn("No legal checkers AI move available", {
      currentPlayer: request.currentPlayer,
      legalMoveCount: request.legalMoves.length,
      forcedPieceSquareIndex: request.position.forcedPieceSquareIndex,
      winner: request.position.winner,
    });
    return {
      move: null,
      selectedIndex: null,
      fallback: true,
      error: "No legal AI move is available.",
    };
  }

  try {
    const selectedIndex = await openAiClient.chooseMoveIndex(request);
    console.info("OpenAI selected checkers move index", {
      currentPlayer: request.currentPlayer,
      selectedIndex,
      legalMoveCount: request.legalMoves.length,
    });
    const move = selectLegalMoveByIndex(request.legalMoves, selectedIndex);

    if (!move) {
      console.warn("OpenAI selected an invalid checkers move index", {
        currentPlayer: request.currentPlayer,
        selectedIndex,
        legalMoveCount: request.legalMoves.length,
      });
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
  } catch (error) {
    const errorMessage =
      error instanceof Error && error.message
        ? error.message
        : "OpenAI move selection failed.";

    console.warn("OpenAI checkers move selection threw", {
      currentPlayer: request.currentPlayer,
      legalMoveCount: request.legalMoves.length,
      forcedPieceSquareIndex: request.position.forcedPieceSquareIndex,
      winner: request.position.winner,
      error: errorMessage,
    });
    return {
      move: null,
      selectedIndex: null,
      fallback: true,
      error: errorMessage,
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
