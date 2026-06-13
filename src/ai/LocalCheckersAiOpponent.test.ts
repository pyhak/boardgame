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

  it("prefers a capture chain over a single capture in skilled mode", async () => {
    const ai = new LocalCheckersAiOpponent("oskaja", () => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [42, { id: "black-42", player: "black", type: "man" }],
        [19, { id: "black-19", player: "black", type: "man" }],
        [44, { id: "black-44", player: "black", type: "king" }],
        [51, { id: "white-51", player: "white", type: "man" }],
        [53, { id: "white-53", player: "white", type: "man" }],
      ]),
    );

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(gameState),
    });

    expect(move).toEqual({ from: 42, to: 60, captures: [51] });

    const nextState = checkersGameService.applyMove(gameState, {
      from: 42,
      to: 60,
    });

    expect(nextState.currentPlayer).toBe("black");
    expect(nextState.forcedPieceSquareIndex).toBe(60);
    expect(nextState.legalTargetIndexes.length).toBeGreaterThan(0);
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

  it("avoids moves that hand the opponent an immediate capture chain", async () => {
    const ai = new LocalCheckersAiOpponent("oskaja", () => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [46, { id: "black-46", player: "black", type: "man" }],
        [33, { id: "black-33", player: "black", type: "king" }],
        [35, { id: "black-35", player: "black", type: "man" }],
        [55, { id: "white-55", player: "white", type: "man" }],
        [40, { id: "white-40", player: "white", type: "king" }],
      ]),
    );

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(gameState),
    });

    expect(move).toEqual({ from: 33, to: 42 });
    expect(
      allowsImmediateOpponentCaptureChain(
        checkersGameService.applyMove(gameState, { from: 33, to: 42 }),
      ),
    ).toBe(false);
    expect(
      allowsImmediateOpponentCaptureChain(
        checkersGameService.applyMove(gameState, { from: 35, to: 44 }),
      ),
    ).toBe(true);
  });

  it("avoids easy opponent promotion in skilled mode", async () => {
    const ai = new LocalCheckersAiOpponent("oskaja", () => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [37, { id: "black-37", player: "black", type: "man" }],
        [42, { id: "black-42", player: "black", type: "man" }],
        [28, { id: "black-28", player: "black", type: "man" }],
        [30, { id: "white-30", player: "white", type: "man" }],
        [33, { id: "white-33", player: "white", type: "king" }],
      ]),
    );

    const move = await ai.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves: checkersGameService.getLegalMoves(gameState),
    });

    expect(move).toEqual({ from: 42, to: 24, captures: [33] });
    expect(
      allowsImmediateOpponentPromotion(
        checkersGameService.applyMove(gameState, { from: 37, to: 23 }),
      ),
    ).toBe(true);
    expect(
      allowsImmediateOpponentPromotion(
        checkersGameService.applyMove(gameState, { from: 42, to: 24 }),
      ),
    ).toBe(false);
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

  it("chooses a materially better move than skilled mode in a tactical position", async () => {
    const skilledAi = new LocalCheckersAiOpponent("oskaja", () => 0);
    const masterAi = new LocalCheckersAiOpponent("meister", () => 0);
    const gameState = createGameState(
      createBoardWithPieces([
        [33, { id: "black-33", player: "black", type: "king" }],
        [53, { id: "black-53", player: "black", type: "man" }],
        [19, { id: "black-19", player: "black", type: "man" }],
        [24, { id: "white-24", player: "white", type: "man" }],
        [17, { id: "white-17", player: "white", type: "man" }],
        [39, { id: "white-39", player: "white", type: "man" }],
      ]),
    );

    const legalMoves = checkersGameService.getLegalMoves(gameState);
    const skilledMove = await skilledAi.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves,
    });
    const masterMove = await masterAi.chooseMove({
      position: gameState,
      player: gameState.currentPlayer,
      legalMoves,
    });

    expect(skilledMove).toEqual({ from: 33, to: 42 });
    expect(masterMove).toEqual({ from: 53, to: 60 });
    expect(
      materialScore(
        checkersGameService.applyMove(gameState, masterMove as NonNullable<typeof masterMove>),
        "black",
      ),
    ).toBeGreaterThan(
      materialScore(
        checkersGameService.applyMove(gameState, skilledMove as NonNullable<typeof skilledMove>),
        "black",
      ),
    );
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

function allowsImmediateOpponentCaptureChain(gameState: CheckersGameState): boolean {
  if (gameState.winner !== null) {
    return false;
  }

  return checkersGameService.getLegalMoves(gameState).some((move) => {
    const piece = gameState.board.squares[move.from].piece;

    if (!piece || piece.player !== gameState.currentPlayer) {
      return false;
    }

    if ((move.captures?.length ?? 0) === 0) {
      return false;
    }

    const nextState = checkersGameService.applyMove(gameState, move);

    return (
      nextState.currentPlayer === gameState.currentPlayer &&
      nextState.forcedPieceSquareIndex !== null
    );
  });
}

function allowsImmediateOpponentPromotion(gameState: CheckersGameState): boolean {
  if (gameState.winner !== null) {
    return false;
  }

  return checkersGameService.getLegalMoves(gameState).some((move) => {
    const piece = gameState.board.squares[move.from].piece;

    if (!piece || piece.player !== gameState.currentPlayer) {
      return false;
    }

    const nextState = checkersGameService.applyMove(gameState, move);

    return nextState.board.squares[move.to].piece?.type === "king";
  });
}

function materialScore(
  boardState: CheckersGameState,
  player: CheckersGameState["currentPlayer"],
): number {
  let score = 0;

  for (const square of boardState.board.squares) {
    if (!square.piece) {
      continue;
    }

    const pieceValue = square.piece.type === "king" ? 340 : 120;
    score += square.piece.player === player ? pieceValue : -pieceValue;
  }

  return score;
}
