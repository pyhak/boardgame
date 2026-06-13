import { describe, expect, it } from "vitest";
import {
  createGameResult,
  createInitialGameSession,
  finishGameSession,
  formatElapsedTime,
  getElapsedSeconds,
  normalizePlayerName,
  resetGameSession,
  shouldRunGameTimer,
  startGameSession,
} from "./gameSession";

describe("gameSession", () => {
  it("formats elapsed time as hh:mm:ss", () => {
    expect(formatElapsedTime(0)).toBe("00:00:00");
    expect(formatElapsedTime(65)).toBe("00:01:05");
    expect(formatElapsedTime(3661)).toBe("01:01:01");
  });

  it("normalizes player names with a default fallback", () => {
    expect(normalizePlayerName("  Anna  ")).toBe("Anna");
    expect(normalizePlayerName("   ")).toBe("Mängija");
  });

  it("starts the game only when the session is started", () => {
    const initialSession = createInitialGameSession();
    const startedSession = startGameSession(initialSession, 1_000, "  Anna  ");

    expect(initialSession.isSetupOpen).toBe(true);
    expect(initialSession.startedAtMs).toBeNull();
    expect(startedSession.isSetupOpen).toBe(false);
    expect(startedSession.startedAtMs).toBe(1_000);
    expect(startedSession.playerName).toBe("Anna");
    expect(shouldRunGameTimer(startedSession)).toBe(true);
  });

  it("stops the timer when a winner is recorded", () => {
    const startedSession = startGameSession(createInitialGameSession(), 1_000);
    const finishedSession = finishGameSession(
      startedSession,
      createGameResult({
        playerName: "Mängija",
        winner: "white",
        elapsedSeconds: 42,
        completedAt: new Date("2026-06-14T12:00:00.000Z").toISOString(),
        moveCount: 12,
      }),
      43_000,
    );

    expect(shouldRunGameTimer(finishedSession)).toBe(false);
    expect(getElapsedSeconds(finishedSession, 99_000)).toBe(42);
  });

  it("creates an in-memory game result for completed games", () => {
    const result = createGameResult({
      playerName: "Mängija",
      winner: "black",
      elapsedSeconds: 120,
      completedAt: "2026-06-14T12:34:56.000Z",
      moveCount: 18,
    });

    expect(result).toEqual({
      playerName: "Mängija",
      winner: "black",
      elapsedSeconds: 120,
      completedAt: "2026-06-14T12:34:56.000Z",
      moveCount: 18,
    });
  });

  it("resets the session for a fresh game", () => {
    const session = resetGameSession(
      finishGameSession(
        startGameSession(createInitialGameSession(), 1_000),
        createGameResult({
          playerName: "Mängija",
          winner: "white",
          elapsedSeconds: 5,
          completedAt: "2026-06-14T12:00:05.000Z",
          moveCount: 3,
        }),
        6_000,
      ),
    );

    expect(session.isSetupOpen).toBe(true);
    expect(session.gameResult).toBeNull();
    expect(session.startedAtMs).toBeNull();
  });
});
