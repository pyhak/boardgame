# AI Agent Instructions

This repository is for `boardgame`, an AI-assisted browser-based 2D board game app.

The first game is English draughts / 8x8 checkers. Chess is planned for later, so keep game logic modular and avoid assumptions that only work for checkers.

## Workflow Rules

- Always create or use an appropriate `feature/` or `fix/` branch before implementation.
- Make small incremental changes that are easy to review.
- Do not mix unrelated changes in the same task, commit, or pull request.
- Explain the plan before large or cross-cutting changes.
- Keep the build and tests green after every meaningful change.
- Do not put game rules inside React components.
- Prefer simple, readable code over clever abstractions.
- After changes, summarize the files changed and commands run.

## Architecture Rules

- React components should render state and collect user input.
- Game rules belong in framework-independent game engine modules.
- Game rules must not depend on React, browser APIs, or UI state.
- AI opponents must be pluggable behind a stable interface.
- Keep checkers-specific logic separate from reusable board-game concepts.
- Design with future chess support in mind, but do not overbuild before it is needed.

## Implementation Guidance

- Use TypeScript types and interfaces to make game state and moves explicit.
- Prefer pure functions for game rules, move validation, and legal move generation.
- Keep files small enough for AI agents to understand and modify safely.
- Add focused tests for rules, move generation, captures, turn handling, and win conditions.
- Avoid broad rewrites unless the user explicitly asks for them.
- When uncertain, document assumptions before implementing.

## Expected Stack

- React
- TypeScript
- Vite
- pnpm
- Vitest
- ESLint
- Prettier

