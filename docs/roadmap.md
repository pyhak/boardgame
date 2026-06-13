# Roadmap

## Sprint 0: Project Bootstrap

- Create React + TypeScript + Vite project with pnpm.
- Add Vitest, ESLint, and Prettier.
- Confirm build and test commands.
- Keep initial structure simple.

## Sprint 1: Board Rendering

- Render an 8x8 board.
- Render checkers pieces from static initial state.
- Add click selection state in the UI.

## Sprint 2: Basic Checkers Movement

- Implement English draughts / 8x8 checkers board setup.
- Add simple diagonal non-capturing moves.
- Add turn handling.
- Add tests for initial setup and basic movement.

## Sprint 3: Captures and Win Conditions

- Add legal capture detection.
- Add capture application.
- Add win detection.
- Add tests for captures and game-over states.

## Sprint 4: Kings

- Add king promotion.
- Add king movement.
- Add tests for promotion and king legal moves.

## Sprint 5: Random AI

- Add `AiOpponent` interface.
- Add random legal-move opponent.
- Allow human vs AI play.

## Sprint 6: OpenAI/ChatGPT AI Adapter

- Add OpenAI-backed AI opponent behind the same `AiOpponent` interface.
- Keep API keys out of client code unless a server/proxy approach is explicitly chosen.
- Add guardrails for move validation so AI can only choose legal moves.

## Sprint 7: Chess Spike

- Explore chess-specific rules and board representation.
- Validate whether shared interfaces are sufficient.
- Add a small proof of concept without disrupting checkers.

