import type { Move, Player } from "../engine/gameEngine";
import { checkersGameService } from "../games/checkers/checkersGameService";
import { getCapturingMoves, getOpponent } from "../games/checkers/checkersRules";
import type { CheckersGameState } from "../games/checkers/checkersTypes";
import type { AiMoveInput, AiOpponent } from "./AiOpponent";

export type LocalAiDifficulty = "algaja" | "oskaja" | "meister";

type RandomNumberGenerator = () => number;

const masterSearchDepth = 3;

export class LocalCheckersAiOpponent
  implements AiOpponent<CheckersGameState, Move>
{
  readonly id = "local-checkers";
  readonly name = "Local AI";

  constructor(
    private readonly difficulty: LocalAiDifficulty = "oskaja",
    private readonly random: RandomNumberGenerator = Math.random,
  ) {}

  async chooseMove(
    input: AiMoveInput<CheckersGameState, Move>,
  ): Promise<Move | null> {
    if (input.position.winner || input.legalMoves.length === 0) {
      return null;
    }

    if (this.difficulty === "algaja") {
      return chooseRandomMove(input.legalMoves, this.random);
    }

    if (this.difficulty === "oskaja") {
      return chooseSkilledMove(input, this.random);
    }

    return chooseMasterMove(input, this.random);
  }
}

export function chooseRandomMove(
  legalMoves: Move[],
  random: RandomNumberGenerator,
): Move | null {
  if (legalMoves.length === 0) {
    return null;
  }

  const index = Math.min(
    Math.floor(random() * legalMoves.length),
    legalMoves.length - 1,
  );

  return legalMoves[index];
}

export function chooseSkilledMove(
  input: AiMoveInput<CheckersGameState, Move>,
  random: RandomNumberGenerator,
): Move | null {
  return chooseBestScoredMove(input, random, scoreSkilledMove);
}

export function chooseMasterMove(
  input: AiMoveInput<CheckersGameState, Move>,
  random: RandomNumberGenerator,
): Move | null {
  return chooseBestScoredMove(input, random, (aiInput, state, move, player) => {
    const nextState = checkersGameService.applyMoveWithResult(state, move).gameState;
    const score = minimax(
      nextState,
      masterSearchDepth - 1,
      aiInput.player,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    );

    return score + scoreMoveBasics(state, move, player) * 10;
  });
}

function chooseBestScoredMove(
  input: AiMoveInput<CheckersGameState, Move>,
  random: RandomNumberGenerator,
  scorer: (
    input: AiMoveInput<CheckersGameState, Move>,
    state: CheckersGameState,
    move: Move,
    player: CheckersGameState["currentPlayer"],
  ) => number,
): Move | null {
  const scoredMoves = input.legalMoves.map((move) => ({
    move,
    score: scorer(input, input.position, move, input.player),
  }));

  const bestScore = Math.max(...scoredMoves.map((entry) => entry.score));
  const bestMoves = scoredMoves
    .filter((entry) => entry.score === bestScore)
    .map((entry) => entry.move);

  return chooseRandomMove(bestMoves, random);
}

function scoreSkilledMove(
  input: AiMoveInput<CheckersGameState, Move>,
  state: CheckersGameState,
  move: Move,
  player: CheckersGameState["currentPlayer"],
): number {
  const result = checkersGameService.applyMoveWithResult(state, move);
  const movedPiece = state.board.squares[move.from].piece;
  let score = scoreMoveBasics(state, move, player);
  const previousOwnMove = findPreviousOwnMove(input.history, player);
  const opponent = getOpponent(player);

  if (result.moveRecord?.captures.length) {
    score += result.moveRecord.captures.length * 200;
  }

  if (result.moveRecord?.promotion) {
    score += 150;
  }

  if (result.gameState.winner === player) {
    return 100_000 + score;
  }

  if (previousOwnMove && isBacktrackingMove(move, previousOwnMove)) {
    score -= 180;
  }

  if (!result.moveRecord?.captures.length && !result.moveRecord?.promotion) {
    const touchesEdge = isEdgeSquare(move.from) || isEdgeSquare(move.to);
    const staysOnEdge = isEdgeSquare(move.from) && isEdgeSquare(move.to);

    if (touchesEdge) {
      score -= 15;
    }

    if (staysOnEdge) {
      score -= 25;
    }
  }

  if (isPromotionThreat(state, movedPiece, move.to)) {
    score += 35;
  }

  score += scoreOpponentCaptureReduction(state.board, result.gameState.board, opponent) * 12;

  if (
    result.gameState.currentPlayer !== player &&
    result.gameState.winner === null
  ) {
    const opponentCaptures = checkersGameService
      .getLegalMoves(result.gameState)
      .filter((candidate) => (candidate.captures?.length ?? 0) > 0);

    const movedPieceVulnerable = opponentCaptures.some((candidate) =>
      candidate.captures?.includes(move.to),
    );

    score += movedPieceVulnerable ? -120 : 40;
  }

  if (
    result.gameState.currentPlayer === player &&
    result.gameState.forcedPieceSquareIndex !== null
  ) {
    score += result.gameState.legalTargetIndexes.length * 25;
  }

  return score;
}

function scoreMoveBasics(
  state: CheckersGameState,
  move: Move,
  player: CheckersGameState["currentPlayer"],
): number {
  const movedPiece = state.board.squares[move.from].piece;
  const destinationRow = state.board.squares[move.to].coordinate.row;
  let score = 0;

  if (!movedPiece) {
    return score;
  }

  score += movedPiece.type === "king" ? 80 : 30;

  if (movedPiece.type === "man") {
    const advancement =
      player === "black"
        ? destinationRow
        : state.board.height - 1 - destinationRow;
    score += advancement * 3;
  }

  return score;
}

function findPreviousOwnMove(
  history: AiMoveInput<CheckersGameState, Move>["history"] | undefined,
  player: Player,
): Move | null {
  if (!history) {
    return null;
  }

  for (let index = history.length - 1; index >= 0; index -= 1) {
    const entry = history[index];

    if (entry.player === player) {
      return entry.move;
    }
  }

  return null;
}

function isBacktrackingMove(move: Move, previousMove: Move): boolean {
  return move.from === previousMove.to && move.to === previousMove.from;
}

function isEdgeSquare(index: number): boolean {
  const row = Math.floor(index / 8);
  const column = index % 8;

  return row === 0 || row === 7 || column === 0 || column === 7;
}

function isPromotionThreat(
  state: CheckersGameState,
  movedPiece: CheckersGameState["board"]["squares"][number]["piece"],
  destinationIndex: number,
): boolean {
  if (!movedPiece || movedPiece.type !== "man") {
    return false;
  }

  const destinationRow = state.board.squares[destinationIndex].coordinate.row;
  const promotionRow = movedPiece.player === "black" ? 7 : 0;

  return Math.abs(promotionRow - destinationRow) === 1;
}

function scoreOpponentCaptureReduction(
  beforeBoard: CheckersGameState["board"],
  afterBoard: CheckersGameState["board"],
  opponent: Player,
): number {
  const beforeCaptures = getCapturingMoves(beforeBoard, opponent).length;
  const afterCaptures = getCapturingMoves(afterBoard, opponent).length;

  return beforeCaptures - afterCaptures;
}

function minimax(
  state: CheckersGameState,
  depth: number,
  maximizingPlayer: CheckersGameState["currentPlayer"],
  alpha: number,
  beta: number,
): number {
  if (depth <= 0 || state.winner) {
    return evaluateState(state, maximizingPlayer);
  }

  const legalMoves = checkersGameService.getLegalMoves(state);

  if (legalMoves.length === 0) {
    return evaluateState(state, maximizingPlayer);
  }

  const isMaximizing = state.currentPlayer === maximizingPlayer;
  let bestScore = isMaximizing
    ? Number.NEGATIVE_INFINITY
    : Number.POSITIVE_INFINITY;

  for (const move of legalMoves) {
    const nextState = checkersGameService.applyMoveWithResult(state, move).gameState;
    const score = minimax(nextState, depth - 1, maximizingPlayer, alpha, beta);

    if (isMaximizing) {
      bestScore = Math.max(bestScore, score);
      alpha = Math.max(alpha, bestScore);
    } else {
      bestScore = Math.min(bestScore, score);
      beta = Math.min(beta, bestScore);
    }

    if (beta <= alpha) {
      break;
    }
  }

  return bestScore;
}

function evaluateState(
  state: CheckersGameState,
  maximizingPlayer: CheckersGameState["currentPlayer"],
): number {
  if (state.winner === maximizingPlayer) {
    return 100_000;
  }

  if (state.winner && state.winner !== maximizingPlayer) {
    return -100_000;
  }

  let score = 0;

  for (const square of state.board.squares) {
    if (!square.piece) {
      continue;
    }

    const isMaximizingPiece = square.piece.player === maximizingPlayer;
    const pieceValue = square.piece.type === "king" ? 180 : 100;
    const advancementBonus =
      square.piece.type === "man"
        ? (square.piece.player === "black"
            ? square.coordinate.row
            : state.board.height - 1 - square.coordinate.row) * 3
        : 0;

    score += isMaximizingPiece
      ? pieceValue + advancementBonus
      : -(pieceValue + advancementBonus);
  }

  return score;
}
