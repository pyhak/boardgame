import { describe, expect, it } from "vitest";
import { createEmptyBoardState } from "../../engine/gameEngine";
import { checkersGameService } from "./checkersGameService";
import type {
  CheckersBoardState,
  CheckersGameState,
  CheckersPiece,
} from "./checkersTypes";

describe("checkersGameService", () => {
  it("creates the initial game state", () => {
    const gameState = checkersGameService.createInitialState();

    expect(gameState.currentPlayer).toBe("black");
    expect(gameState.selectedSquareIndex).toBeNull();
    expect(gameState.legalTargetIndexes).toEqual([]);
    expect(gameState.forcedPieceSquareIndex).toBeNull();
    expect(gameState.winner).toBeNull();
    expect(gameState.statusMessage).toBe("Black to move");
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

  it("does not expose simple targets when another piece must capture", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
        [21, { id: "black-21", player: "black", type: "man" }],
        [26, { id: "white-26", player: "white", type: "man" }],
      ]),
    );
    const nextState = checkersGameService.handleSquareClick(gameState, 21);

    expect(nextState.selectedSquareIndex).toBe(21);
    expect(nextState.legalTargetIndexes).toEqual([]);
  });

  it("continues with the same piece when another capture is available", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
        [26, { id: "white-26", player: "white", type: "man" }],
        [44, { id: "white-44", player: "white", type: "man" }],
        [56, { id: "white-56", player: "white", type: "man" }],
      ]),
    );

    const nextState = checkersGameService.applyMove(gameState, {
      from: 17,
      to: 35,
    });

    expect(nextState.currentPlayer).toBe("black");
    expect(nextState.selectedSquareIndex).toBe(35);
    expect(nextState.forcedPieceSquareIndex).toBe(35);
    expect(nextState.legalTargetIndexes).toEqual([53]);
    expect(nextState.statusMessage).toBe("Black must continue capturing");
  });

  it("allows only the same piece to continue a multi-capture", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
        [21, { id: "black-21", player: "black", type: "man" }],
        [26, { id: "white-26", player: "white", type: "man" }],
        [44, { id: "white-44", player: "white", type: "man" }],
        [56, { id: "white-56", player: "white", type: "man" }],
      ]),
    );
    const forcedState = checkersGameService.applyMove(gameState, {
      from: 17,
      to: 35,
    });

    expect(checkersGameService.handleSquareClick(forcedState, 21)).toBe(
      forcedState,
    );
    expect(
      checkersGameService.applyMove(forcedState, { from: 21, to: 28 }),
    ).toBe(forcedState);
  });

  it("switches turns after a capture chain ends", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
        [26, { id: "white-26", player: "white", type: "man" }],
        [44, { id: "white-44", player: "white", type: "man" }],
        [56, { id: "white-56", player: "white", type: "man" }],
      ]),
    );
    const forcedState = checkersGameService.applyMove(gameState, {
      from: 17,
      to: 35,
    });
    const nextState = checkersGameService.applyMove(forcedState, {
      from: 35,
      to: 53,
    });

    expect(nextState.currentPlayer).toBe("white");
    expect(nextState.selectedSquareIndex).toBeNull();
    expect(nextState.forcedPieceSquareIndex).toBeNull();
    expect(nextState.legalTargetIndexes).toEqual([]);
    expect(nextState.statusMessage).toBe("White to move");
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
