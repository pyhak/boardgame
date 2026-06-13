# boardgame

Browser-based 2D board game app. The first implementation target is English draughts / 8x8 checkers.

## Setup

```bash
pnpm install
```

## Development

Run the local OpenAI proxy server in one terminal:

```bash
OPENAI_API_KEY=sk-your-openai-api-key pnpm server:dev
```

Run the Vite client in another terminal:

```bash
pnpm dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3001`.
The browser client never reads `OPENAI_API_KEY`; only the server reads it from
the environment. `.env.example` documents the expected variables, but the server
does not load `.env` automatically.

## Test

```bash
pnpm test
```

## Build

```bash
pnpm build
```

## Lint and Format

```bash
pnpm lint
pnpm format:check
```
