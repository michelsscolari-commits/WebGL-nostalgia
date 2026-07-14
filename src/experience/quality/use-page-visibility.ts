import { useSyncExternalStore } from "react";

function getPageVisibility(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState !== "hidden";
}

function subscribeToPageVisibility(onStoreChange: () => void): () => void {
  if (typeof document === "undefined") return () => undefined;

  document.addEventListener("visibilitychange", onStoreChange);

  if (typeof window !== "undefined") {
    window.addEventListener("pageshow", onStoreChange);
    window.addEventListener("pagehide", onStoreChange);
  }

  return () => {
    document.removeEventListener("visibilitychange", onStoreChange);

    if (typeof window !== "undefined") {
      window.removeEventListener("pageshow", onStoreChange);
      window.removeEventListener("pagehide", onStoreChange);
    }
  };
}

/** Indica se a página pode manter o loop visual ativo. */
export function usePageVisibility(): boolean {
  return useSyncExternalStore(
    subscribeToPageVisibility,
    getPageVisibility,
    () => true,
  );
}
