import type { Player } from "../../engine/gameEngine";
import type { CheckersMoveRecord } from "./checkersTypes";

export type CheckersMoveActor = "human" | "ai";

export function buildCheckersMoveComment(
  moveRecord: CheckersMoveRecord,
  aiPlayer: Player | null,
  actor: CheckersMoveActor,
): string | null {
  if (!aiPlayer) {
    return null;
  }

  const sentences: string[] = [];
  const aiMoved = moveRecord.player === aiPlayer;

  if (actor === "ai") {
    if (moveRecord.captures.length > 0) {
      sentences.push("AI võttis nupu.");
    }

    if (moveRecord.promotion) {
      sentences.push("AI sai tammiks.");
    }

    return sentences.length > 0 ? sentences.join(" ") : null;
  }

  if (moveRecord.captures.length > 0 || moveRecord.promotion) {
    sentences.push("Tugev käik.");
  }

  if (!aiMoved && moveRecord.captures.length > 0) {
    sentences.push("AI kaotas nupu.");
  }

  if (!aiMoved && moveRecord.promotion) {
    sentences.push("Sa said tammiks.");
  }

  return sentences.length > 0 ? sentences.join(" ") : null;
}
