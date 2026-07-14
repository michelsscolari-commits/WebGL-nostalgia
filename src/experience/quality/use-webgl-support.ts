import { useSyncExternalStore } from "react";

export type WebGLSupport = 2 | false;

let cachedSupport: WebGLSupport | undefined;

function canCreateContext(type: "webgl2"): boolean {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    return canvas.getContext(type) !== null;
  } catch {
    return false;
  }
}

/** Detecta WebGL 2, requisito mínimo do renderer usado pelo Three.js atual. */
export function detectWebGLSupport(): WebGLSupport {
  if (canCreateContext("webgl2")) return 2;
  return false;
}

export function getWebGLSupport(): WebGLSupport {
  if (cachedSupport === undefined) {
    cachedSupport = detectWebGLSupport();
  }

  return cachedSupport;
}

function subscribeToWebGLSupport(): () => void {
  return () => undefined;
}

/**
 * Expõe a capacidade inicial do navegador. Perda de contexto é tratada pelo Canvas.
 */
export function useWebGLSupport(): WebGLSupport {
  return useSyncExternalStore(
    subscribeToWebGLSupport,
    getWebGLSupport,
    () => false,
  );
}
