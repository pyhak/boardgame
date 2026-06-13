# Checkers

This package contains the supported 8x8 kabe/checkers ruleset.

Supported rules:
- Men move one diagonal square forward.
- Men capture one opponent piece on any diagonal direction.
- Kings/tammid move any number of empty diagonal squares.
- Kings/tammid capture by jumping one opponent piece and landing on any empty
  square beyond it on the same diagonal.
- Promotion can happen during a capture chain, and the promoted king continues
  the same turn if another capture exists.
- Mandatory capture and multi-capture chains apply.

Chess and 10x10 draughts are separate future rulesets.
