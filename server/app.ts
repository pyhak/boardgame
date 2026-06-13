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
    console.info("Received checkers AI proxy request", {
      hasBody: Boolean(request.body),
      contentType: request.headers["content-type"],
    });

    if (!isCheckersAiMoveRequest(request.body)) {
      console.warn("Rejected invalid checkers AI proxy request body", {
        bodyType: typeof request.body,
      });
      response.status(400).json({
        move: null,
        selectedIndex: null,
        fallback: true,
        error: "Invalid checkers AI request body.",
      });
      return;
    }

    const result = await chooseCheckersAiMove(request.body, openAiClient);

    console.info("Checkers AI proxy request resolved", {
      fallback: result.fallback,
      selectedIndex: result.selectedIndex,
      moveReturned: Boolean(result.move),
      error: result.error,
    });

    response.status(result.fallback ? 502 : 200).json(result);
  });

  return app;
}
