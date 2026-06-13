# Rules

`boardgame` currently supports one ruleset: 8x8 kabe/checkers.

Supported rules:
- Pieces start on the dark squares of the first and last three rows.
- Men move one diagonal square forward.
- Men may capture one opponent piece on any diagonal direction.
- Captures are mandatory when available.
- A capture chain continues with the same piece if another capture exists.
- Men promote to king on the back row.
- If promotion happens during a capture chain, the promoted king continues the
  same turn when another capture exists.
- Kings/tammid move any number of empty diagonal squares.
- Kings/tammid capture one opponent piece on a diagonal and may land on any
  empty square beyond it on the same diagonal.
- Flying king multi-captures are supported.
- A player wins when the opponent has no pieces or no legal moves.

Out of scope for this ruleset:
- Chess
- 10x10 draughts
- Flying men
- Online multiplayer
