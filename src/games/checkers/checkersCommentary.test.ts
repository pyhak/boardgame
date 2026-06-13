import { describe, expect, it } from "vitest";
import type { CheckersMoveRecord } from "./checkersTypes";
import { buildCheckersMoveComment } from "./checkersCommentary";

describe("checkers commentary", () => {
  it("describes an AI capture", () => {
    const moveRecord: CheckersMoveRecord = {
      player: "black",
      from: 17,
      to: 35,
      captures: [26],
      promotion: false,
    };

    expect(buildCheckersMoveComment(moveRecord, "black", "ai")).toBe(
      "AI võttis nupu.",
    );
  });

  it("describes a human capture as a strong move and AI loss", () => {
    const moveRecord: CheckersMoveRecord = {
      player: "white",
      from: 42,
      to: 49,
      captures: [35],
      promotion: false,
    };

    expect(buildCheckersMoveComment(moveRecord, "black", "human")).toBe(
      "Tugev käik. AI kaotas nupu.",
    );
  });

  it("describes an AI promotion", () => {
    const moveRecord: CheckersMoveRecord = {
      player: "black",
      from: 49,
      to: 56,
      captures: [],
      promotion: true,
    };

    expect(buildCheckersMoveComment(moveRecord, "black", "ai")).toBe(
      "AI sai tammiks.",
    );
  });
});
