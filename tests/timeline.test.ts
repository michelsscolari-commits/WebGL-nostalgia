import { describe, expect, it } from "vitest";

import {
  getDocumentProgress,
  resolveAnchoredProgress,
  resolveScrollPhase,
} from "../src/experience/quality/timeline";

describe("timeline pública da experiência", () => {
  it("normaliza a rolagem pela distância realmente rolável", () => {
    expect(
      getDocumentProgress({
        scrollY: 450,
        scrollHeight: 1_500,
        viewportHeight: 600,
      }),
    ).toBe(0.5);

    expect(
      getDocumentProgress({
        scrollY: -20,
        scrollHeight: 1_500,
        viewportHeight: 600,
      }),
    ).toBe(0);

    expect(
      getDocumentProgress({
        scrollY: 2_000,
        scrollHeight: 1_500,
        viewportHeight: 600,
      }),
    ).toBe(1);
  });

  it("interpola apenas entre estados adjacentes", () => {
    expect(resolveScrollPhase(0.25, 7)).toEqual({
      from: 1,
      to: 2,
      localProgress: 0.5,
    });

    expect(resolveScrollPhase(1, 7)).toEqual({
      from: 6,
      to: 6,
      localProgress: 0,
    });
  });

  it("alinha o progresso aos centros reais dos capítulos", () => {
    const anchors = [100, 300, 500];

    expect(resolveAnchoredProgress(0, anchors)).toBe(0);
    expect(resolveAnchoredProgress(100, anchors)).toBe(0);
    expect(resolveAnchoredProgress(200, anchors)).toBe(0.25);
    expect(resolveAnchoredProgress(300, anchors)).toBe(0.5);
    expect(resolveAnchoredProgress(400, anchors)).toBe(0.75);
    expect(resolveAnchoredProgress(700, anchors)).toBe(1);
  });
});
