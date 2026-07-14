import { describe, expect, it } from "vitest";

import { resolveInteractionPolicy } from "../src/experience/quality/interaction-policy";

describe("política pública de movimento e interação", () => {
  it("mantém movimento, gesto e qualidade no modo normal", () => {
    expect(
      resolveInteractionPolicy({
        motionPaused: false,
        prefersReducedMotion: false,
        pageVisible: true,
      }),
    ).toEqual({
      ambientMotionEnabled: true,
      directInputStrength: 1,
      visualClockAdvances: true,
      frameLoop: "always",
      staticQualityPreserved: true,
    });
  });

  it("remove movimento autônomo sem apagar o gesto em movimento reduzido", () => {
    expect(
      resolveInteractionPolicy({
        motionPaused: false,
        prefersReducedMotion: true,
        pageVisible: true,
      }),
    ).toEqual({
      ambientMotionEnabled: false,
      directInputStrength: 0.42,
      visualClockAdvances: false,
      frameLoop: "always",
      staticQualityPreserved: true,
    });
  });

  it("pausa toda a apresentação sem degradar a composição", () => {
    expect(
      resolveInteractionPolicy({
        motionPaused: true,
        prefersReducedMotion: false,
        pageVisible: true,
      }),
    ).toEqual({
      ambientMotionEnabled: false,
      directInputStrength: 0,
      visualClockAdvances: false,
      frameLoop: "demand",
      staticQualityPreserved: true,
    });
  });

  it("interrompe o renderer quando a página fica oculta", () => {
    expect(
      resolveInteractionPolicy({
        motionPaused: false,
        prefersReducedMotion: false,
        pageVisible: false,
      }).frameLoop,
    ).toBe("never");
  });
});
