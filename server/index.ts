import "dotenv/config";
import { createServerApp } from "./app";
import { ResponsesApiMoveClient } from "./openAiMoveClient";

const port = Number(process.env.PORT ?? 3001);
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("OPENAI_API_KEY is required for the AI proxy server.");
  process.exit(1);
}

const app = createServerApp(new ResponsesApiMoveClient(apiKey));

app.listen(port, () => {
  console.log(`AI proxy server listening on http://localhost:${port}`);
});
