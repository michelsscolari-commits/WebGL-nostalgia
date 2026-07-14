import { useMemo, useSyncExternalStore } from "react";
import {
  resolveQualityProfile,
  type QualityEnvironment,
  type QualityProfile,
} from "./quality-profile";
import { useReducedMotion } from "./use-reduced-motion";

const SERVER_ENVIRONMENT_SIGNATURE = "0|1|4";

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

function finitePositiveOr(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getEnvironmentSignature(): string {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return SERVER_ENVIRONMENT_SIGNATURE;
  }

  return [
    Math.max(0, Math.round(window.innerWidth)),
    finitePositiveOr(window.devicePixelRatio, 1),
    Math.round(finitePositiveOr(navigator.hardwareConcurrency, 4)),
  ].join("|");
}

function parseEnvironmentSignature(
  signature: string,
): Omit<QualityEnvironment, "prefersReducedMotion"> {
  const [viewportWidth, devicePixelRatio, hardwareConcurrency] = signature
    .split("|")
    .map(Number);

  return {
    viewportWidth,
    devicePixelRatio,
    hardwareConcurrency,
  };
}

function subscribeToEnvironment(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  let dprQuery: LegacyMediaQueryList | null = null;

  const removeDprListener = () => {
    if (!dprQuery) return;

    if (typeof dprQuery.removeEventListener === "function") {
      dprQuery.removeEventListener("change", handleDprChange);
    } else {
      dprQuery.removeListener?.(handleDprChange);
    }
  };

  const watchCurrentDpr = () => {
    if (typeof window.matchMedia !== "function") return;

    removeDprListener();
    dprQuery = window.matchMedia(
      `(resolution: ${finitePositiveOr(window.devicePixelRatio, 1)}dppx)`,
    ) as LegacyMediaQueryList;

    if (typeof dprQuery.addEventListener === "function") {
      dprQuery.addEventListener("change", handleDprChange);
    } else {
      dprQuery.addListener?.(handleDprChange);
    }
  };

  function handleDprChange(): void {
    watchCurrentDpr();
    onStoreChange();
  }

  watchCurrentDpr();
  window.addEventListener("resize", onStoreChange, { passive: true });
  window.visualViewport?.addEventListener("resize", onStoreChange, {
    passive: true,
  });

  return () => {
    removeDprListener();
    window.removeEventListener("resize", onStoreChange);
    window.visualViewport?.removeEventListener("resize", onStoreChange);
  };
}

/** Perfil adaptativo responsivo a viewport, DPR, hardware e acessibilidade. */
export function useQualityProfile(): QualityProfile {
  const prefersReducedMotion = useReducedMotion();
  const environmentSignature = useSyncExternalStore(
    subscribeToEnvironment,
    getEnvironmentSignature,
    () => SERVER_ENVIRONMENT_SIGNATURE,
  );

  return useMemo(
    () =>
      resolveQualityProfile({
        ...parseEnvironmentSignature(environmentSignature),
        prefersReducedMotion,
      }),
    [environmentSignature, prefersReducedMotion],
  );
}
