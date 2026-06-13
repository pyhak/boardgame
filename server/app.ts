import express from "express";
import {
  chooseCheckersAiMove,
  isCheckersAiMoveRequest,
  type OpenAiMoveClient,
} from "./checkersAi";

export function createServerApp(openAiClient: OpenAiMoveClient) {
  const app = express();

  app.use(express.json({ limit: "64kb" }));

  app.post("/api/ai/checkers/move", async (request, response) => {
    if (!isCheckersAiMoveRequest(request.body)) {
      response.status(400).json({
        move: null,
        selectedIndex: null,
        fallback: true,
        error: "Invalid checkers AI request body.",
      });
      return;
    }

    const result = await chooseCheckersAiMove(request.body, openAiClient);
    response.status(result.fallback ? 502 : 200).json(result);
  });

  return app;
}
