import { describe, expect, it } from "vitest";
import { createEmptyBoardState } from "../engine/gameEngine";
import { checkersGameService } from "../games/checkers/checkersGameService";
import type {
  CheckersBoardState,
  CheckersGameState,
  CheckersPiece,
} from "../games/checkers/checkersTypes";
import { RandomCheckersAiOpponent } from "./RandomCheckersAiOpponent";

describe("RandomCheckersAiOpponent", () => {
  it("only returns legal moves", async () => {
    const ai = new RandomCheckersAiOpponent(() => 0.99);
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

  it("respects mandatory captures", async () => {
    const ai = new RandomCheckersAiOpponent(() => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
        [21, { id: "black-21", player: "black", type: "man" }],
        [26, { id: "white-26", player: "white", type: "man" }],
      ]),
    );

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(gameState),
    });

    expect(move).toEqual({ from: 17, to: 35, captures: [26] });
  });

  it("can continue and complete a required capture chain", async () => {
    const ai = new RandomCheckersAiOpponent(() => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
        [26, { id: "white-26", player: "white", type: "man" }],
        [44, { id: "white-44", player: "white", type: "man" }],
        [56, { id: "white-56", player: "white", type: "man" }],
      ]),
    );

    const firstMove = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(gameState),
    });
    expect(firstMove).toEqual({ from: 17, to: 35, captures: [26] });

    const forcedState = checkersGameService.applyMove(gameState, firstMove!);
    expect(forcedState.currentPlayer).toBe("black");
    expect(forcedState.forcedPieceSquareIndex).toBe(35);

    const secondMove = await ai.chooseMove({
      position: forcedState,
      player: forcedState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(forcedState),
    });
    expect(secondMove).toEqual({ from: 35, to: 53, captures: [44] });

    const completedState = checkersGameService.applyMove(
      forcedState,
      secondMove!,
    );
    expect(completedState.currentPlayer).toBe("white");
    expect(completedState.forcedPieceSquareIndex).toBeNull();
    expect(completedState.board.squares[26].piece).toBeNull();
    expect(completedState.board.squares[44].piece).toBeNull();
  });

  it("does not move after the game is won", async () => {
    const ai = new RandomCheckersAiOpponent(() => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
      ]),
      "black",
      "black",
    );

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: [{ from: 17, to: 24 }],
    });

    expect(move).toBeNull();
  });
});

function createGameState(
  board: CheckersBoardState,
  currentPlayer: CheckersGameState["currentPlayer"] = "black",
  winner: CheckersGameState["winner"] = null,
): CheckersGameState {
  return {
    board,
    currentPlayer,
    selectedSquareIndex: null,
    legalTargetIndexes: [],
    forcedPieceSquareIndex: null,
    winner,
    statusMessage: winner ? "Black wins" : "Black to move",
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
