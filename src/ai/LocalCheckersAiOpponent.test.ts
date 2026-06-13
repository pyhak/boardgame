import { describe, expect, it } from "vitest";
import { createEmptyBoardState } from "../engine/gameEngine";
import { checkersGameService } from "../games/checkers/checkersGameService";
import type {
  CheckersBoardState,
  CheckersGameState,
  CheckersPiece,
} from "../games/checkers/checkersTypes";
import { LocalCheckersAiOpponent } from "./LocalCheckersAiOpponent";

describe("LocalCheckersAiOpponent", () => {
  it("returns a legal move in beginner mode", async () => {
    const ai = new LocalCheckersAiOpponent("algaja", () => 0.99);
    const gameState = checkersGameService.createInitialState();
    const legalMoves = checkersGameService.getLegalMoves(gameState);

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves,
    });

    expect(move).not.toBeNull();
    expect(legalMoves).toContainEqual(move);
  });

  it("prefers promotion in skilled mode", async () => {
    const ai = new LocalCheckersAiOpponent("oskaja", () => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [49, { id: "black-49", player: "black", type: "man" }],
      ]),
    );

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(gameState),
    });

    expect(move).toEqual({ from: 49, to: 56 });
  });

  it("prefers a safer move in skilled mode", async () => {
    const ai = new LocalCheckersAiOpponent("oskaja", () => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [16, { id: "white-16", player: "white", type: "king" }],
        [18, { id: "black-18", player: "black", type: "man" }],
      ]),
    );

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(gameState),
    });

    expect(move).toEqual({ from: 18, to: 27 });
  });

  it("avoids moving the same piece straight back in skilled mode", async () => {
    const ai = new LocalCheckersAiOpponent("oskaja", () => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [27, { id: "black-27", player: "black", type: "king" }],
      ]),
    );

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(gameState),
      history: [
        {
          player: "black",
          move: { from: 36, to: 27 },
        },
      ],
    });

    expect(move).not.toEqual({ from: 27, to: 36 });
    expect(move).not.toBeNull();
  });

  it("prefers non-edge king moves over edge shuffling in skilled mode", async () => {
    const ai = new LocalCheckersAiOpponent("oskaja", () => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [27, { id: "black-27", player: "black", type: "king" }],
      ]),
    );

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(gameState),
    });

    expect(move).not.toBeNull();
    if (move) {
      expect([0, 7, 56, 63]).not.toContain(move.to);
    }
  });

  it("uses minimax to avoid an immediate recapture in master mode", async () => {
    const ai = new LocalCheckersAiOpponent("meister", () => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [16, { id: "white-16", player: "white", type: "king" }],
        [18, { id: "black-18", player: "black", type: "man" }],
      ]),
    );

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(gameState),
    });

    expect(move).toEqual({ from: 18, to: 27 });
  });
});

function createGameState(board: CheckersBoardState): CheckersGameState {
  return {
    board,
    currentPlayer: "black",
    selectedSquareIndex: null,
    legalTargetIndexes: [],
    forcedPieceSquareIndex: null,
    winner: null,
    statusMessage: "Black to move",
  };
}

function createBoardWithPieces(
  pieces: Array<[number, CheckersPiece]>,
): CheckersBoardState {
  const board = createEmptyBoardState<CheckersPiece>();
  const piecesByIndex = new Map(pieces);

  return {
    ...board,
    squares: board.squares.map((square) => ({
      ...square,
      piece: piecesByIndex.get(square.index) ?? null,
    })),
  };
}
