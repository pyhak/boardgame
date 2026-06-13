import type { Move, Player } from "../engine/gameEngine";
import { checkersGameService } from "../games/checkers/checkersGameService";
import { getOpponent } from "../games/checkers/checkersRules";
import type { CheckersGameState } from "../games/checkers/checkersTypes";
import type { AiMoveInput, AiOpponent } from "./AiOpponent";

export type LocalAiDifficulty = "algaja" | "oskaja" | "meister";

type RandomNumberGenerator = () => number;

const masterSearchDepth = 4;
const manValue = 120;
const kingValue = 340;
const captureValue = 420;
const promotionValue = 520;
const continuationBonus = 260;
const opponentDangerPenalty = 420;
const opponentPromotionPenalty = 620;
const edgePenalty = 25;
const backtrackingPenalty = 220;
const promotionThreatBonus = 140;

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

    return score + scoreSkilledMove(aiInput, state, move, player) / 4;
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
  let score =
    evaluateBoard(state.board, player) * -1 +
    evaluateBoard(result.gameState.board, player);
  const previousOwnMove = findPreviousOwnMove(input.history, player);
  const opponent = getOpponent(player);
  const captureCount = result.moveRecord?.captures.length ?? 0;
  const continuationScore = scoreForcedContinuation(
    result.gameState,
    player,
    3,
  );

  if (captureCount > 0) {
    score += captureValue * captureCount;
    score += Math.max(0, captureCount - 1) * 220;
  }

  if (result.moveRecord?.promotion) {
    score += promotionValue;
  }

  if (result.gameState.winner === player) {
    return 100_000 + score;
  }

  if (previousOwnMove && isBacktrackingMove(move, previousOwnMove)) {
    score -= backtrackingPenalty;
  }

  if (!captureCount && !result.moveRecord?.promotion) {
    score -= scoreEdgeShuffling(move);
  }

  if (isPromotionThreat(state, movedPiece, move.to)) {
    score += promotionThreatBonus;
  }

  score += continuationScore;

  if (
    result.gameState.currentPlayer !== player &&
    result.gameState.winner === null
  ) {
    score -= scoreOpponentDanger(result.gameState, player);
    score += scoreOpponentCaptureReduction(
      state.board,
      result.gameState.board,
      opponent,
    ) * 18;
  }

  if (
    result.gameState.currentPlayer === player &&
    result.gameState.forcedPieceSquareIndex !== null
  ) {
    score += result.gameState.legalTargetIndexes.length * continuationBonus;
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

function scoreEdgeShuffling(move: Move): number {
  const fromEdge = isEdgeSquare(move.from);
  const toEdge = isEdgeSquare(move.to);

  if (fromEdge && toEdge) {
    return edgePenalty * 2;
  }

  if (fromEdge || toEdge) {
    return edgePenalty;
  }

  return 0;
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
  const beforeCaptures = countCaptures(beforeBoard, opponent);
  const afterCaptures = countCaptures(afterBoard, opponent);

  return beforeCaptures - afterCaptures;
}

function countCaptures(
  board: CheckersGameState["board"],
  player: Player,
): number {
  return checkersGameService.getLegalMoves({
    board,
    currentPlayer: player,
    selectedSquareIndex: null,
    legalTargetIndexes: [],
    forcedPieceSquareIndex: null,
    winner: null,
    statusMessage: "",
  }).filter((move) => (move.captures?.length ?? 0) > 0).length;
}

function scoreOpponentDanger(
  state: CheckersGameState,
  player: CheckersGameState["currentPlayer"],
): number {
  const opponent = getOpponent(player);
  const replies = checkersGameService
    .getLegalMoves(state)
    .filter((candidate) => state.board.squares[candidate.from].piece?.player === opponent);

  if (replies.length === 0) {
    return 0;
  }

  let worstDanger = 0;

  for (const reply of replies) {
    const replyResult = checkersGameService.applyMoveWithResult(state, reply);
    const replyCaptures = replyResult.moveRecord?.captures.length ?? 0;
    let danger =
      evaluateBoard(state.board, player) - evaluateBoard(replyResult.gameState.board, player);

    if (replyCaptures > 0) {
      danger += opponentDangerPenalty * replyCaptures;
      danger += Math.max(0, replyCaptures - 1) * 200;
    }

    if (replyResult.moveRecord?.promotion) {
      danger += opponentPromotionPenalty;
    }

    if (
      replyResult.gameState.currentPlayer === opponent &&
      replyResult.gameState.forcedPieceSquareIndex !== null
    ) {
      danger += continuationBonus * 2;
      danger += scoreForcedContinuation(replyResult.gameState, opponent, 3);
    }

    if (replyResult.gameState.winner === opponent) {
      danger += 5000;
    }

    if (replyResult.gameState.winner === player) {
      danger -= 5000;
    }

    worstDanger = Math.max(worstDanger, danger);
  }

  return worstDanger;
}

function scoreForcedContinuation(
  state: CheckersGameState,
  player: CheckersGameState["currentPlayer"],
  depth: number,
): number {
  if (depth <= 0 || state.winner !== null) {
    return 0;
  }

  if (state.currentPlayer !== player || state.forcedPieceSquareIndex === null) {
    return 0;
  }

  const forcedMoves = checkersGameService
    .getLegalMoves(state)
    .filter((move) => move.from === state.forcedPieceSquareIndex);

  let bestScore = 0;

  for (const move of forcedMoves) {
    const result = checkersGameService.applyMoveWithResult(state, move);
    const captures = result.moveRecord?.captures.length ?? 0;
    let score = captures * captureValue;

    if (captures > 1) {
      score += (captures - 1) * 220;
    }

    if (result.moveRecord?.promotion) {
      score += promotionValue;
    }

    if (result.gameState.winner === player) {
      score += 2000;
    }

    score += evaluateBoard(result.gameState.board, player) -
      evaluateBoard(state.board, player);

    if (
      result.gameState.currentPlayer === player &&
      result.gameState.forcedPieceSquareIndex !== null
    ) {
      score += scoreForcedContinuation(result.gameState, player, depth - 1);
    }

    bestScore = Math.max(bestScore, score);
  }

  return bestScore;
}

function evaluateBoard(
  board: CheckersGameState["board"],
  perspectivePlayer: Player,
): number {
  let score = 0;

  for (const square of board.squares) {
    if (!square.piece) {
      continue;
    }

    const pieceValue = square.piece.type === "king" ? kingValue : manValue;
    const advancement =
      square.piece.type === "man"
        ? square.piece.player === "black"
          ? square.coordinate.row * 8
          : (board.height - 1 - square.coordinate.row) * 8
        : 0;
    const pieceScore = pieceValue + advancement;

    score += square.piece.player === perspectivePlayer
      ? pieceScore
      : -pieceScore;
  }

  return score;
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

  const legalMoves = orderMovesForSearch(
    state,
    checkersGameService.getLegalMoves(state),
    maximizingPlayer,
  );

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

function orderMovesForSearch(
  state: CheckersGameState,
  moves: Move[],
  maximizingPlayer: CheckersGameState["currentPlayer"],
): Move[] {
  return [...moves].sort((left, right) => {
    const leftScore = scoreSearchMove(state, left, maximizingPlayer);
    const rightScore = scoreSearchMove(state, right, maximizingPlayer);

    return rightScore - leftScore;
  });
}

function scoreSearchMove(
  state: CheckersGameState,
  move: Move,
  maximizingPlayer: CheckersGameState["currentPlayer"],
): number {
  const result = checkersGameService.applyMoveWithResult(state, move);
  const captures = result.moveRecord?.captures.length ?? 0;
  let score =
    evaluateState(result.gameState, maximizingPlayer) -
    evaluateState(state, maximizingPlayer);

  score += captures * captureValue;
  if (result.moveRecord?.promotion) {
    score += promotionValue;
  }

  if (result.gameState.winner === maximizingPlayer) {
    score += 2000;
  }

  if (
    result.gameState.currentPlayer === maximizingPlayer &&
    result.gameState.forcedPieceSquareIndex !== null
  ) {
    score += result.gameState.legalTargetIndexes.length * continuationBonus;
  }

  return score;
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

  return evaluateBoard(state.board, maximizingPlayer);
}
