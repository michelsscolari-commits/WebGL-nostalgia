import { describe, expect, it } from "vitest";

import {
  createPhosphorTargetData,
  PHOSPHOR_STATE_COUNT,
} from "../src/experience/phosphor-targets";

function extent(values: Float32Array, axis: 0 | 1 | 2): number {
  let minimum = Number.POSITIVE_INFINITY;
  let maximum = Number.NEGATIVE_INFINITY;

  for (let index = axis; index < values.length; index += 3) {
    minimum = Math.min(minimum, values[index]);
    maximum = Math.max(maximum, values[index]);
  }

  return maximum - minimum;
}

describe("gerador público da matéria de fósforo", () => {
  it("preserva identidade, contagem e determinismo nos sete estados", () => {
    const first = createPhosphorTargetData(2_048, 0x435254);
    const second = createPhosphorTargetData(2_048, 0x435254);

    expect(first.stateCount).toBe(PHOSPHOR_STATE_COUNT);
    expect(first.states).toHaveLength(7);
    expect(first.metadata).toHaveLength(2_048 * 4);

    for (const state of first.states) {
      expect(state).toHaveLength(2_048 * 3);
      expect(Array.from(state).every(Number.isFinite)).toBe(true);
    }

    expect(first.states[4]).toEqual(second.states[4]);
    expect(first.metadata).toEqual(second.metadata);
  });

  it("forma feixe, raster curvo e volume CRT com proporções distintas", () => {
    const matter = createPhosphorTargetData(4_096, 0x435254);
    const beam = matter.states[1];
    const raster = matter.states[2];
    const persistence = matter.states[6];

    expect(extent(beam, 0)).toBeGreaterThan(9);
    expect(extent(beam, 1)).toBeLessThan(0.2);

    expect(extent(raster, 0)).toBeGreaterThan(8);
    expect(extent(raster, 1)).toBeGreaterThan(5);
    expect(extent(raster, 2)).toBeGreaterThan(0.6);

    expect(extent(persistence, 0)).toBeGreaterThan(8);
    expect(extent(persistence, 1)).toBeGreaterThan(4.5);
    expect(extent(persistence, 2)).toBeGreaterThan(1.5);
  });
});
