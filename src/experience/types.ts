import type { InteractionPolicy, QualityProfile } from "./quality";

export interface PointerCoordinates {
  x: number;
  y: number;
}
export interface ExperienceRefs {
  progress: { current: number };
  velocity: { current: number };
  visualTime: { current: number };
  pointer: { current: PointerCoordinates };
}

export interface VisualStateProps {
  refs: ExperienceRefs;
  interaction: InteractionPolicy;
  quality: QualityProfile;
  motionPaused: boolean;
  reducedMotion: boolean;
}
