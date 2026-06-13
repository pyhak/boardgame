# boardgame

Browser-based 2D board game app. The first implementation target is 8x8 kabe /
checkers.
The normal gameplay path uses local AI; the OpenAI proxy is optional and experimental.

## Setup

```bash
pnpm install
```

## Development

Run the local Vite client in one terminal:

```bash
pnpm dev
```

Local AI runs in the browser and does not need any API key.

If you want to experiment with the OpenAI proxy, run the server in a separate
terminal:

```bash
OPENAI_API_KEY=sk-your-openai-api-key pnpm server:dev
```

The Vite dev server proxies `/api` requests to `http://localhost:3001` for
experimental OpenAI use.
The browser client never reads `OPENAI_API_KEY`; only the server reads it from
the environment. `.env.example` documents the expected variables.

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
