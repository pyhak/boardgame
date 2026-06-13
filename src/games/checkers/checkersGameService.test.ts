import { describe, expect, it } from "vitest";
import { checkersGameService } from "./checkersGameService";

describe("checkersGameService", () => {
  it("creates the initial game state", () => {
    const gameState = checkersGameService.createInitialState();

    expect(gameState.currentPlayer).toBe("black");
    expect(gameState.selectedSquareIndex).toBeNull();
    expect(gameState.legalTargetIndexes).toEqual([]);
    expect(
      gameState.board.squares.filter((square) => square.piece !== null),
    ).toHaveLength(24);
  });

  it("selects the current player's piece and exposes legal targets", () => {
    const gameState = checkersGameService.createInitialState();
    const nextState = checkersGameService.handleSquareClick(gameState, 17);

    expect(nextState.selectedSquareIndex).toBe(17);
    expect(nextState.legalTargetIndexes).toEqual([24, 26]);
  });

  it("ignores clicks on the opponent's pieces before selection", () => {
    const gameState = checkersGameService.createInitialState();
    const nextState = checkersGameService.handleSquareClick(gameState, 40);

    expect(nextState).toBe(gameState);
  });

  it("keeps state unchanged for an invalid target", () => {
    const selectedState = checkersGameService.handleSquareClick(
      checkersGameService.createInitialState(),
      17,
    );
    const nextState = checkersGameService.handleSquareClick(selectedState, 27);

    expect(nextState).toBe(selectedState);
  });

  it("moves a selected piece and switches players after a legal target click", () => {
    const selectedState = checkersGameService.handleSquareClick(
      checkersGameService.createInitialState(),
      17,
    );
    const nextState = checkersGameService.handleSquareClick(selectedState, 24);

    expect(nextState.currentPlayer).toBe("white");
    expect(nextState.selectedSquareIndex).toBeNull();
    expect(nextState.legalTargetIndexes).toEqual([]);
    expect(nextState.board.squares[17].piece).toBeNull();
    expect(nextState.board.squares[24].piece?.player).toBe("black");
  });

  it("can apply a service-level move without click selection", () => {
    const gameState = checkersGameService.createInitialState();
    const nextState = checkersGameService.applyMove(gameState, {
      from: 17,
      to: 26,
    });

    expect(nextState.currentPlayer).toBe("white");
    expect(nextState.board.squares[26].piece?.player).toBe("black");
  });
});
