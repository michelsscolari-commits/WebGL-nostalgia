import { afterEach, describe, expect, it, vi } from "vitest";

import { detectWebGLSupport } from "../src/experience/quality/use-webgl-support";

function exposeContexts(contexts: ReadonlySet<string>): void {
  vi.stubGlobal("document", {
    createElement: () => ({
      getContext: (type: string) => (contexts.has(type) ? {} : null),
    }),
  });
}

describe("detectWebGLSupport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("aceita um contexto WebGL 2", () => {
    exposeContexts(new Set(["webgl2"]));

    expect(detectWebGLSupport()).toBe(2);
  });

  it("usa fallback quando só WebGL 1 está disponível", () => {
    exposeContexts(new Set(["webgl"]));

    expect(detectWebGLSupport()).toBe(false);
  });

  it("usa fallback quando nenhum contexto está disponível", () => {
    exposeContexts(new Set());

    expect(detectWebGLSupport()).toBe(false);
  });
});
