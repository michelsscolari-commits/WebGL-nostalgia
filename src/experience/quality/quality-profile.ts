export type QualityTier = "low" | "medium" | "high";

export interface QualityEnvironment {
  viewportWidth: number;
  devicePixelRatio: number;
  hardwareConcurrency: number;
  prefersReducedMotion: boolean;
}
export interface QualityProfile {
  tier: QualityTier;
  particleCount: number;
  filamentSegments: number;
  dpr: number;
  postprocessingEnabled: boolean;
}

const PROFILE_BY_TIER: Record<
  QualityTier,
  Omit<QualityProfile, "dpr" | "tier"> & { maximumDpr: number }
> = {
  low: {
    particleCount: 18_000,
    filamentSegments: 2_000,
    maximumDpr: 1,
    postprocessingEnabled: false,
  },
  medium: {
    particleCount: 32_000,
    filamentSegments: 4_000,
    maximumDpr: 1.35,
    postprocessingEnabled: true,
  },
  high: {
    particleCount: 56_000,
    filamentSegments: 8_000,
    maximumDpr: 1.75,
    postprocessingEnabled: true,
  },
};

function resolveTier({
  viewportWidth,
  hardwareConcurrency,
}: QualityEnvironment): QualityTier {
  if (viewportWidth < 640 || hardwareConcurrency <= 4) return "low";
  if (viewportWidth >= 1_200 && hardwareConcurrency >= 8) return "high";
  return "medium";
}

export function resolveQualityProfile(
  environment: QualityEnvironment,
): QualityProfile {
  const tier = resolveTier(environment);
  const profile = PROFILE_BY_TIER[tier];

  return {
    tier,
    particleCount: profile.particleCount,
    filamentSegments: profile.filamentSegments,
    dpr: Math.min(Math.max(environment.devicePixelRatio, 1), profile.maximumDpr),
    postprocessingEnabled: profile.postprocessingEnabled,
  };
}
