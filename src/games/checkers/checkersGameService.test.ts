import { describe, expect, it } from "vitest";
import { createEmptyBoardState } from "../../engine/gameEngine";
import { checkersGameService } from "./checkersGameService";
import { getCheckersGameStateInvariantIssues } from "./checkersStateInvariant";
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

  it("resets to a fresh initial game state", () => {
    const movedState = checkersGameService.applyMove(
      checkersGameService.createInitialState(),
      { from: 17, to: 24 },
    );
    const resetState = checkersGameService.reset();

    expect(movedState.board.squares[24].piece?.player).toBe("black");
    expect(resetState).toEqual(checkersGameService.createInitialState());
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

  it("switches turns after normal moves even when the moved piece could capture next", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
        [35, { id: "white-35", player: "white", type: "man" }],
        [56, { id: "white-56", player: "white", type: "man" }],
      ]),
    );
    const nextState = checkersGameService.applyMove(gameState, {
      from: 17,
      to: 26,
    });

    expect(nextState.currentPlayer).toBe("white");
    expect(nextState.forcedPieceSquareIndex).toBeNull();
    expect(nextState.selectedSquareIndex).toBeNull();
    expect(nextState.statusMessage).toBe("White to move");
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

  it("returns move records for simple moves", () => {
    const result = checkersGameService.applyMoveWithResult(
      checkersGameService.createInitialState(),
      { from: 17, to: 24 },
    );

    expect(result.moveRecord).toEqual({
      player: "black",
      from: 17,
      to: 24,
      captures: [],
      promotion: false,
    });
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

  it("keeps the same man forced after the first capture", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
        [26, { id: "white-26", player: "white", type: "man" }],
        [44, { id: "white-44", player: "white", type: "man" }],
      ]),
    );

    const nextState = checkersGameService.applyMove(gameState, {
      from: 17,
      to: 35,
    });

    expect(nextState.forcedPieceSquareIndex).toBe(35);
    expect(nextState.selectedSquareIndex).toBe(35);
    expect(nextState.legalTargetIndexes).toEqual([53]);
    expect(nextState.currentPlayer).toBe("black");
  });

  it("does not allow changing to another piece during a capture chain", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
        [21, { id: "black-21", player: "black", type: "man" }],
        [26, { id: "white-26", player: "white", type: "man" }],
        [44, { id: "white-44", player: "white", type: "man" }],
      ]),
    );

    const forcedState = checkersGameService.applyMove(gameState, {
      from: 17,
      to: 35,
    });

    expect(
      checkersGameService.handleSquareClick(forcedState, 21),
    ).toBe(forcedState);
  });

  it("returns capture and promotion indicators in move records", () => {
    const captureResult = checkersGameService.applyMoveWithResult(
      createGameState(
        createBoardWithPieces([
          [17, { id: "black-17", player: "black", type: "man" }],
          [26, { id: "white-26", player: "white", type: "man" }],
          [56, { id: "white-56", player: "white", type: "man" }],
        ]),
      ),
      { from: 17, to: 35 },
    );
    const promotionResult = checkersGameService.applyMoveWithResult(
      createGameState(
        createBoardWithPieces([
          [49, { id: "black-49", player: "black", type: "man" }],
          [40, { id: "white-40", player: "white", type: "man" }],
        ]),
      ),
      { from: 49, to: 56 },
    );

    expect(captureResult.moveRecord).toEqual({
      player: "black",
      from: 17,
      to: 35,
      captures: [26],
      promotion: false,
    });
    expect(promotionResult.moveRecord).toEqual({
      player: "black",
      from: 49,
      to: 56,
      captures: [],
      promotion: true,
    });
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

  it("continues a white man capture chain without giving black a turn", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [46, { id: "white-46", player: "white", type: "man" }],
        [37, { id: "black-37", player: "black", type: "man" }],
        [19, { id: "black-19", player: "black", type: "man" }],
        [1, { id: "black-1", player: "black", type: "man" }],
      ]),
      "white",
    );

    const firstCapture = checkersGameService.applyMove(gameState, {
      from: 46,
      to: 28,
    });

    expect(firstCapture.currentPlayer).toBe("white");
    expect(firstCapture.forcedPieceSquareIndex).toBe(28);
    expect(firstCapture.legalTargetIndexes).toEqual([10]);
    expect(firstCapture.statusMessage).toBe("White must continue capturing");

    const secondCapture = checkersGameService.applyMove(firstCapture, {
      from: 28,
      to: 10,
    });

    expect(secondCapture.currentPlayer).toBe("black");
    expect(secondCapture.forcedPieceSquareIndex).toBeNull();
    expect(secondCapture.winner).toBeNull();
    expect(secondCapture.board.squares[37].piece).toBeNull();
    expect(secondCapture.board.squares[19].piece).toBeNull();
    expect(secondCapture.board.squares[10].piece?.player).toBe("white");
  });

  it("keeps white forced after the visible h4 to f6 capture when a backward follow-up exists", () => {
    let gameState = checkersGameService.createInitialState();

    gameState = checkersGameService.applyMove(gameState, {
      from: notationToIndex("h6"),
      to: notationToIndex("g5"),
    });
    gameState = checkersGameService.applyMove(gameState, {
      from: notationToIndex("g3"),
      to: notationToIndex("h4"),
    });
    gameState = checkersGameService.applyMove(gameState, {
      from: notationToIndex("b6"),
      to: notationToIndex("c5"),
    });
    gameState = checkersGameService.applyMove(gameState, {
      from: notationToIndex("h2"),
      to: notationToIndex("g3"),
    });
    gameState = checkersGameService.applyMove(gameState, {
      from: notationToIndex("f6"),
      to: notationToIndex("e5"),
    });

    const firstCapture = checkersGameService.applyMove(gameState, {
      from: notationToIndex("h4"),
      to: notationToIndex("f6"),
    });
    const followUpMoves = checkersGameService
      .getLegalMoves(firstCapture)
      .filter((move) => move.from === notationToIndex("f6"));

    expect(
      followUpMoves.map((move) => ({
        from: indexToNotation(move.from),
        to: indexToNotation(move.to),
        captures: move.captures?.map(indexToNotation) ?? [],
      })),
    ).toEqual([
      {
        from: "f6",
        to: "d4",
        captures: ["e5"],
      },
    ]);
    expect(firstCapture.currentPlayer).toBe("white");
    expect(firstCapture.forcedPieceSquareIndex).toBe(notationToIndex("f6"));
    expect(firstCapture.legalTargetIndexes).toEqual([notationToIndex("d4")]);
    expect(firstCapture.statusMessage).toBe("White must continue capturing");

    const secondCapture = checkersGameService.applyMove(firstCapture, {
      from: notationToIndex("f6"),
      to: notationToIndex("d4"),
    });

    expect(secondCapture.currentPlayer).toBe("white");
    expect(secondCapture.forcedPieceSquareIndex).toBe(notationToIndex("d4"));
    expect(secondCapture.legalTargetIndexes).toEqual([notationToIndex("b6")]);
    expect(secondCapture.statusMessage).toBe("White must continue capturing");
    expect(secondCapture.board.squares[notationToIndex("e5")].piece).toBeNull();
    expect(
      secondCapture.board.squares[notationToIndex("d4")].piece?.player,
    ).toBe("white");

    const thirdCapture = checkersGameService.applyMove(secondCapture, {
      from: notationToIndex("d4"),
      to: notationToIndex("b6"),
    });

    expect(thirdCapture.currentPlayer).toBe("black");
    expect(thirdCapture.forcedPieceSquareIndex).toBeNull();
    expect(thirdCapture.board.squares[notationToIndex("c5")].piece).toBeNull();
    expect(
      thirdCapture.board.squares[notationToIndex("b6")].piece?.player,
    ).toBe("white");
  });

  it("replays the visible ending tail without leaving the board stuck", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [10, { id: "black-10", player: "black", type: "man" }],
        [8, { id: "white-8", player: "white", type: "man" }],
        [1, { id: "black-1", player: "black", type: "man" }],
        [19, { id: "white-19", player: "white", type: "man" }],
        [28, { id: "white-28", player: "white", type: "man" }],
      ]),
    );

    const afterBlackC7B6 = checkersGameService.applyMove(gameState, {
      from: notationToIndex("c7"),
      to: notationToIndex("b6"),
    });
    const afterWhiteA7C5 = checkersGameService.applyMove(afterBlackC7B6, {
      from: notationToIndex("a7"),
      to: notationToIndex("c5"),
    });
    const afterBlackB8A7 = checkersGameService.applyMove(afterWhiteA7C5, {
      from: notationToIndex("b8"),
      to: notationToIndex("a7"),
    });
    const afterWhiteD6E7 = checkersGameService.applyMove(afterBlackB8A7, {
      from: notationToIndex("d6"),
      to: notationToIndex("e7"),
    });
    const finalState = checkersGameService.applyMove(afterWhiteD6E7, {
      from: notationToIndex("a7"),
      to: notationToIndex("b6"),
    });

    expect(getCheckersGameStateInvariantIssues(finalState)).toEqual([]);
    expect(finalState.forcedPieceSquareIndex).toBeNull();
    expect(finalState.winner).toBeNull();
    expect(finalState.currentPlayer).toBe("white");

    const legalMoves = checkersGameService.getLegalMoves(finalState);
    expect(legalMoves.length).toBeGreaterThan(0);
    expect(
      legalMoves.some((move) =>
        finalState.board.squares[move.from].piece?.player === "white",
      ),
    ).toBe(true);

    const selectableMove = legalMoves.find((move) => move.from === 26);
    expect(selectableMove).toBeDefined();
    if (selectableMove) {
      const selectedState = checkersGameService.handleSquareClick(
        finalState,
        selectableMove.from,
      );
      expect(selectedState.selectedSquareIndex).toBe(selectableMove.from);
    }
  });

  it("replays the exact passive-loop history without violating invariants", () => {
    const replay: Array<{ from: string; to: string }> = [
      { from: "h6", to: "g5" },
      { from: "g3", to: "h4" },
      { from: "b6", to: "a5" },
      { from: "a3", to: "b4" },
      { from: "d6", to: "e5" },
      { from: "e3", to: "d4" },
      { from: "g5", to: "f4" },
      { from: "f2", to: "g3" },
      { from: "c7", to: "d6" },
      { from: "d4", to: "c5" },
      { from: "g7", to: "h6" },
      { from: "e1", to: "f2" },
      { from: "h6", to: "g5" },
      { from: "f2", to: "e3" },
      { from: "f8", to: "g7" },
      { from: "b2", to: "a3" },
      { from: "g7", to: "h6" },
      { from: "e3", to: "d4" },
      { from: "b8", to: "c7" },
      { from: "g1", to: "f2" },
      { from: "c7", to: "b6" },
      { from: "f2", to: "e3" },
      { from: "h8", to: "g7" },
    ];

    let gameState = checkersGameService.createInitialState();

    for (const step of replay) {
      const legalMoves = checkersGameService.getLegalMoves(gameState);
      const chosenFrom = notationToIndex(step.from);
      const chosenTo = notationToIndex(step.to);
      const legalMove = legalMoves.find(
        (move) => move.from === chosenFrom && move.to === chosenTo,
      );
      const captureMoves = legalMoves.filter(
        (move) => (move.captures?.length ?? 0) > 0,
      );

      expect(legalMove, `${step.from} -> ${step.to} should be legal`).toBeDefined();
      if (captureMoves.length > 0) {
        expect(
          legalMove?.captures?.length ?? 0,
          `${step.from} -> ${step.to} should capture when captures are available`,
        ).toBeGreaterThan(0);
      }

      gameState = checkersGameService.applyMove(gameState, {
        from: chosenFrom,
        to: chosenTo,
      });

      expect(getCheckersGameStateInvariantIssues(gameState)).toEqual([]);
    }

    expect(gameState.currentPlayer).toBe("white");
    expect(gameState.winner).toBeNull();
    expect(gameState.forcedPieceSquareIndex).toBeNull();
    expect(checkersGameService.getLegalMoves(gameState).length).toBeGreaterThan(0);
    expect(
      checkersGameService
        .getLegalMoves(gameState)
        .some((move) => gameState.board.squares[move.from].piece?.player === "white"),
    ).toBe(true);
  });

  it("promotes a man during a capture and continues the chain as a king", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [40, { id: "black-40", player: "black", type: "man" }],
        [49, { id: "white-49", player: "white", type: "man" }],
        [51, { id: "white-51", player: "white", type: "man" }],
      ]),
    );

    const firstCapture = checkersGameService.applyMove(gameState, {
      from: 40,
      to: 58,
    });

    expect(firstCapture.currentPlayer).toBe("black");
    expect(firstCapture.forcedPieceSquareIndex).toBe(58);
    expect(firstCapture.legalTargetIndexes).toEqual(
      expect.arrayContaining([44]),
    );
    expect(firstCapture.board.squares[58].piece?.type).toBe("king");

    const secondCapture = checkersGameService.applyMove(firstCapture, {
      from: 58,
      to: 44,
    });

    expect(secondCapture.currentPlayer).toBe("black");
    expect(secondCapture.winner).toBe("black");
    expect(secondCapture.board.squares[49].piece).toBeNull();
    expect(secondCapture.board.squares[51].piece).toBeNull();
    expect(secondCapture.board.squares[44].piece?.type).toBe("king");
  });

  it("captures two pieces in one turn with a man", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [17, { id: "black-17", player: "black", type: "man" }],
        [26, { id: "white-26", player: "white", type: "man" }],
        [44, { id: "white-44", player: "white", type: "man" }],
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

    expect(nextState.winner).toBe("black");
    expect(nextState.board.squares[26].piece).toBeNull();
    expect(nextState.board.squares[44].piece).toBeNull();
    expect(nextState.board.squares[53].piece?.player).toBe("black");
  });

  it("continues multi-captures with kings", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [35, { id: "black-35", player: "black", type: "king" }],
        [26, { id: "white-26", player: "white", type: "man" }],
        [10, { id: "white-10", player: "white", type: "man" }],
      ]),
    );

    const forcedState = checkersGameService.applyMove(gameState, {
      from: 35,
      to: 17,
    });

    expect(forcedState.currentPlayer).toBe("black");
    expect(forcedState.selectedSquareIndex).toBe(17);
    expect(forcedState.forcedPieceSquareIndex).toBe(17);
    expect(forcedState.legalTargetIndexes).toEqual([3]);

    const nextState = checkersGameService.applyMove(forcedState, {
      from: 17,
      to: 3,
    });

    expect(nextState.winner).toBe("black");
    expect(nextState.board.squares[3].piece?.type).toBe("king");
    expect(nextState.board.squares[10].piece).toBeNull();
    expect(nextState.statusMessage).toBe("Black wins");
  });

  it("captures two pieces in one turn with a king", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [35, { id: "black-35", player: "black", type: "king" }],
        [26, { id: "white-26", player: "white", type: "man" }],
        [10, { id: "white-10", player: "white", type: "man" }],
      ]),
    );

    const forcedState = checkersGameService.applyMove(gameState, {
      from: 35,
      to: 17,
    });
    const nextState = checkersGameService.applyMove(forcedState, {
      from: 17,
      to: 3,
    });

    expect(nextState.winner).toBe("black");
    expect(nextState.board.squares[26].piece).toBeNull();
    expect(nextState.board.squares[10].piece).toBeNull();
    expect(nextState.board.squares[3].piece?.type).toBe("king");
  });

  it("continues flying king multi-captures only after a capture", () => {
    const gameState = createGameState(
      createBoardWithPieces([
        [14, { id: "black-14", player: "black", type: "king" }],
        [28, { id: "white-28", player: "white", type: "man" }],
        [44, { id: "white-44", player: "white", type: "man" }],
        [63, { id: "white-63", player: "white", type: "man" }],
      ]),
    );

    const forcedState = checkersGameService.applyMove(gameState, {
      from: 14,
      to: 35,
    });

    expect(forcedState.currentPlayer).toBe("black");
    expect(forcedState.forcedPieceSquareIndex).toBe(35);
    expect(forcedState.legalTargetIndexes).toEqual([53, 62]);

    const nextState = checkersGameService.applyMove(forcedState, {
      from: 35,
      to: 53,
    });

    expect(nextState.currentPlayer).toBe("white");
    expect(nextState.forcedPieceSquareIndex).toBeNull();
    expect(nextState.board.squares[28].piece).toBeNull();
    expect(nextState.board.squares[44].piece).toBeNull();
  });
});

function createGameState(
  board: CheckersBoardState,
  currentPlayer: CheckersGameState["currentPlayer"] = "black",
): CheckersGameState {
  return {
    board,
    currentPlayer,
    selectedSquareIndex: null,
    legalTargetIndexes: [],
    forcedPieceSquareIndex: null,
    winner: null,
    statusMessage:
      currentPlayer === "black" ? "Black to move" : "White to move",
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

function notationToIndex(notation: string): number {
  const file = notation.charCodeAt(0) - 97;
  const rank = Number.parseInt(notation.slice(1), 10);

  return (8 - rank) * 8 + file;
}

function indexToNotation(index: number): string {
  const row = Math.floor(index / 8);
  const column = index % 8;

  return `${String.fromCharCode(97 + column)}${8 - row}`;
}
