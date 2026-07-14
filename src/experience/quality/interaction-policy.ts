export type FrameLoopPolicy = "always" | "demand" | "never";

export interface InteractionEnvironment {
  motionPaused: boolean;
  prefersReducedMotion: boolean;
  pageVisible: boolean;
}
export interface InteractionPolicy {
  ambientMotionEnabled: boolean;
  directInputStrength: number;
  visualClockAdvances: boolean;
  frameLoop: FrameLoopPolicy;
  staticQualityPreserved: true;
}

export function resolveInteractionPolicy({
  motionPaused,
  prefersReducedMotion,
  pageVisible,
}: InteractionEnvironment): InteractionPolicy {
  if (!pageVisible) {
    return {
      ambientMotionEnabled: false,
      directInputStrength: 0,
      visualClockAdvances: false,
      frameLoop: "never",
      staticQualityPreserved: true,
    };
  }

  if (motionPaused) {
    return {
      ambientMotionEnabled: false,
      directInputStrength: 0,
      visualClockAdvances: false,
      frameLoop: "demand",
      staticQualityPreserved: true,
    };
  }

  if (prefersReducedMotion) {
    return {
      ambientMotionEnabled: false,
      directInputStrength: 0.42,
      visualClockAdvances: false,
      frameLoop: "always",
      staticQualityPreserved: true,
    };
  }

  return {
    ambientMotionEnabled: true,
    directInputStrength: 1,
    visualClockAdvances: true,
    frameLoop: "always",
    staticQualityPreserved: true,
  };
}
