import type { Player } from "../engine/gameEngine";

export interface GameResult {
  playerName: string;
  winner: Player;
  elapsedSeconds: number;
  completedAt: string;
  moveCount: number;
}

export interface GameSession {
  playerNameInput: string;
  playerName: string;
  startedAtMs: number | null;
  finishedAtMs: number | null;
  isSetupOpen: boolean;
  isResultVisible: boolean;
  gameResult: GameResult | null;
}

export function createInitialGameSession(
  defaultPlayerName = "Mängija",
): GameSession {
  return {
    playerNameInput: defaultPlayerName,
    playerName: defaultPlayerName,
    startedAtMs: null,
    finishedAtMs: null,
    isSetupOpen: true,
    isResultVisible: false,
    gameResult: null,
  };
}

export function normalizePlayerName(
  playerNameInput: string,
  fallback = "Mängija",
): string {
  const trimmed = playerNameInput.trim();

  return trimmed.length > 0 ? trimmed : fallback;
}

export function startGameSession(
  session: GameSession,
  nowMs: number,
  playerNameInput?: string,
): GameSession {
  const playerName = normalizePlayerName(
    playerNameInput ?? session.playerNameInput,
    session.playerName,
  );

  return {
    ...session,
    playerNameInput: playerName,
    playerName,
    startedAtMs: nowMs,
    finishedAtMs: null,
    isSetupOpen: false,
    isResultVisible: false,
    gameResult: null,
  };
}

export function finishGameSession(
  session: GameSession,
  result: GameResult,
  completedAtMs: number,
): GameSession {
  return {
    ...session,
    finishedAtMs: completedAtMs,
    isResultVisible: true,
    gameResult: result,
  };
}

export function resetGameSession(session: GameSession): GameSession {
  return {
    ...session,
    startedAtMs: null,
    finishedAtMs: null,
    isSetupOpen: true,
    isResultVisible: false,
    gameResult: null,
  };
}

export function shouldRunGameTimer(session: Pick<GameSession, "startedAtMs" | "finishedAtMs">): boolean {
  return session.startedAtMs !== null && session.finishedAtMs === null;
}

export function getElapsedSeconds(
  session: Pick<GameSession, "startedAtMs" | "finishedAtMs">,
  nowMs: number,
): number {
  if (session.startedAtMs === null) {
    return 0;
  }

  const endMs = session.finishedAtMs ?? nowMs;

  return Math.max(0, Math.floor((endMs - session.startedAtMs) / 1000));
}

export function createGameResult(
  input: GameResult,
): GameResult {
  return input;
}

export function formatElapsedTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
