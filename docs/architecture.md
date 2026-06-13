# Architecture

`boardgame` should separate rendering, game rules, game-specific implementations, and AI opponents. The main goal is to keep the codebase understandable for AI agents and flexible enough to add chess later.

## Layers

## UI Layer

The UI layer is responsible for:

- Rendering the board, pieces, controls, and game status.
- Handling clicks and future drag/drop events.
- Calling game engine APIs to validate and apply moves.
- Showing legal moves and errors.

React must not contain game rules. React components should not decide whether a move is legal, whether a capture is required, whether a player has won, or how pieces move.

## Game Engine Layer

The game engine layer is responsible for generic board-game orchestration:

- Current board state.
- Current player.
- Applying moves through a rules implementation.
- Asking rules for legal moves.
- Detecting game-over state through rules.

The engine should not depend on React.

## Game Implementation Layer

The game implementation layer contains concrete rulesets:

- 8x8 kabe/checkers first.
- Chess later.
- Estonian or international 10x10 draughts later as separate rulesets.

Rules must be testable without rendering a UI.

## AI Layer

The AI layer provides opponents behind a common interface:

- Random legal-move opponent first.
- ChatGPT/OpenAI adapter later.
- Future strategic or search-based opponents.

AI code should depend on the game interfaces, not React components.

## Proposed Folder Structure

```text
src/
  app/
    App.tsx
    main.tsx
  ui/
    board/
      BoardView.tsx
      SquareView.tsx
      PieceView.tsx
    game/
      GameStatus.tsx
      PlayerControls.tsx
  engine/
    gameEngine.ts
    types.ts
  games/
    checkers/
      checkersRules.ts
      checkersTypes.ts
      checkersSetup.ts
      checkersRules.test.ts
    chess/
      README.md
  ai/
    AiOpponent.ts
    randomOpponent.ts
    openAiOpponent.ts
```

This structure is a proposal. Future agents may adjust it when implementation begins, but they should preserve the same separation of responsibilities.

## Key Interfaces

```ts
export type Player = "black" | "white";

export interface Piece {
  id: string;
  player: Player;
  type: string;
}

export interface BoardState<TPiece extends Piece = Piece> {
  width: number;
  height: number;
  squares: Array<TPiece | null>;
}

export interface Move {
  from: number;
  to: number;
  captures?: number[];
  promotion?: boolean;
}

export interface GameRules<TBoard extends BoardState = BoardState> {
  getInitialBoard(): TBoard;
  getLegalMoves(board: TBoard, player: Player): Move[];
  isLegalMove(board: TBoard, player: Player, move: Move): boolean;
  applyMove(board: TBoard, player: Player, move: Move): TBoard;
  getWinner(board: TBoard): Player | null;
}

export interface AiOpponent<TBoard extends BoardState = BoardState> {
  id: string;
  name: string;
  chooseMove(input: {
    board: TBoard;
    player: Player;
    legalMoves: Move[];
  }): Promise<Move>;
}
```

The exact types can evolve during implementation. Keep the public concepts stable unless there is a clear reason to change them.

## Design Constraints

- Game rules must not import React.
- React components must not encode checkers or chess movement rules.
- Board coordinates should be represented consistently and documented.
- Rules should be deterministic and covered by Vitest tests.
- AI opponents should receive legal moves instead of duplicating rules.
