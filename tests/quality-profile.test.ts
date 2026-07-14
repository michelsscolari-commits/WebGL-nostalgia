import { describe, expect, it } from "vitest";

import { resolveQualityProfile } from "../src/experience/quality/quality-profile";

describe("perfil público de qualidade", () => {
  it("limita partículas e DPR por capacidade do dispositivo", () => {
    expect(
      resolveQualityProfile({
        viewportWidth: 390,
        devicePixelRatio: 3,
        hardwareConcurrency: 8,
        prefersReducedMotion: false,
      }),
    ).toEqual({
      tier: "low",
      particleCount: 18_000,
      filamentSegments: 2_000,
      dpr: 1,
      postprocessingEnabled: false,
    });

    expect(
      resolveQualityProfile({
        viewportWidth: 1_440,
        devicePixelRatio: 2,
        hardwareConcurrency: 12,
        prefersReducedMotion: false,
      }),
    ).toEqual({
      tier: "high",
      particleCount: 56_000,
      filamentSegments: 8_000,
      dpr: 1.75,
      postprocessingEnabled: true,
    });
  });

  it("não degrada qualidade estática por preferência de movimento", () => {
    const environment = {
      viewportWidth: 1_100,
      devicePixelRatio: 2,
      hardwareConcurrency: 8,
    };

    expect(
      resolveQualityProfile({
        ...environment,
        prefersReducedMotion: true,
      }),
    ).toEqual(
      resolveQualityProfile({
        ...environment,
        prefersReducedMotion: false,
      }),
    );
  });
});
