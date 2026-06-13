# Product Requirements

## Product Goal

`boardgame` is a browser-based 2D board game app designed to support human play and pluggable AI opponents. The project should be structured so AI coding agents can safely continue development without mixing UI concerns, game rules, and AI logic.

## Initial Scope

The first implementation will be English draughts / 8x8 checkers.

This means:

- 8x8 board.
- Two players.
- Diagonal movement.
- Captures according to the selected English draughts ruleset.
- Kings added as part of the checkers milestone plan.
- Browser-based interaction using React.

Estonian or international 10x10 draughts may be added later as a separate ruleset. The first implementation should not mix 8x8 and 10x10 rules.

## Player Interaction

The initial interaction model should be simple:

- Click a piece to select it.
- Click a destination square to attempt a move.
- Show legal destinations when useful.
- Reject illegal moves clearly in the UI.

Drag and drop can be added later after the click-based flow works reliably.

## AI Opponents

The first AI opponent can be random/legal-move based:

- It receives the current board state and available legal moves.
- It chooses one legal move.
- It does not need strategy at first.

A ChatGPT/OpenAI opponent can come later behind the same `AiOpponent` interface. The UI and game rules should not need to change when a new AI opponent is added.

## Out of Scope Initially

- React app scaffolding until the user requests it.
- Chess implementation.
- Online multiplayer.
- User accounts.
- Drag and drop.
- OpenAI integration.
- Advanced checkers strategy.

