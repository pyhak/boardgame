import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { createServerApp } from "./app";
import type { CheckersAiMoveRequest } from "./checkersAi";

const request: CheckersAiMoveRequest = {
  currentPlayer: "black",
  position: {
    pieces: [
      { index: 17, player: "black", type: "man" },
      { index: 26, player: "white", type: "man" },
    ],
    forcedPieceSquareIndex: null,
    winner: null,
  },
  legalMoves: [{ from: 17, to: 35, captures: [26] }],
};

const servers: Array<{ close: () => void }> = [];

afterEach(() => {
  for (const server of servers.splice(0)) {
    server.close();
  }
});

describe("checkers AI Express endpoint", () => {
  it("returns selected legal moves from an injected OpenAI client", async () => {
    const url = await startServer({
      chooseMoveIndex: async () => 0,
    });

    const response = await fetch(`${url}/api/ai/checkers/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    await expect(response.json()).resolves.toEqual({
      move: request.legalMoves[0],
      selectedIndex: 0,
      fallback: false,
    });
    expect(response.status).toBe(200);
  });

  it("returns 400 for invalid request bodies", async () => {
    const url = await startServer({
      chooseMoveIndex: async () => 0,
    });

    const response = await fetch(`${url}/api/ai/checkers/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bad: true }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      move: null,
      fallback: true,
    });
  });
});

async function startServer(openAiClient: { chooseMoveIndex: () => Promise<number> }) {
  const app = createServerApp(openAiClient);
  const server = app.listen(0, "127.0.0.1");
  servers.push(server);

  await new Promise<void>((resolve) => server.once("listening", resolve));

  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}
