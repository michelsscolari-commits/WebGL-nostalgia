import { useSyncExternalStore } from "react";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type LegacyMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

function getReducedMotionQuery(): LegacyMediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia(REDUCED_MOTION_QUERY) as LegacyMediaQueryList;
}

function subscribeToReducedMotion(onStoreChange: () => void): () => void {
  const query = getReducedMotionQuery();

  if (!query) return () => undefined;

  const handleChange = () => onStoreChange();

  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }

  query.addListener?.(handleChange);
  return () => query.removeListener?.(handleChange);
}

/** Lê a preferência atual sem criar uma assinatura. Seguro durante SSR. */
export function getReducedMotionPreference(): boolean {
  return getReducedMotionQuery()?.matches ?? false;
}

/**
 * Acompanha a preferência do sistema como uma store externa do navegador.
 * O snapshot do servidor é conservador para não iniciar movimento antes da hidratação.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionPreference,
    () => true,
  );
}
