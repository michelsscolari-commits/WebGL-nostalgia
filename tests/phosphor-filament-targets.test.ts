import { describe, expect, it } from "vitest";

import {
  createPhosphorFilamentTargetData,
  PHOSPHOR_FILAMENT_STATE_COUNT,
} from "../src/experience/phosphor-filament-targets";

describe("gerador público dos filamentos de fósforo", () => {
  it.each([2_000, 4_000, 8_000] as const)(
    "preserva os %i segmentos e sua identidade nos sete estados",
    (segmentCount) => {
      const first = createPhosphorFilamentTargetData(segmentCount, 0x435254);
      const second = createPhosphorFilamentTargetData(segmentCount, 0x435254);
      const vertexCount = segmentCount * 2;

      expect(first.segmentCount).toBe(segmentCount);
      expect(first.vertexCount).toBe(vertexCount);
      expect(first.stateCount).toBe(PHOSPHOR_FILAMENT_STATE_COUNT);
      expect(first.states).toHaveLength(7);
      expect(first.metadata).toHaveLength(vertexCount * 4);

      for (const state of first.states) {
        expect(state).toHaveLength(vertexCount * 3);
      }

      expect(first.states[6]).toEqual(second.states[6]);
      expect(first.metadata).toEqual(second.metadata);
    },
  );

  it("liga vértices vizinhos da mesma lane e faz a seed participar da identidade", () => {
    const first = createPhosphorFilamentTargetData(2_000, 0x435254);
    const otherSeed = createPhosphorFilamentTargetData(2_000, 0x504f5354);
    let sameLaneCount = 0;
    let adjacentPointCount = 0;

    for (let segment = 0; segment < first.segmentCount; segment += 1) {
      const firstVertex = segment * 2;
      const secondVertex = firstVertex + 1;
      const firstMetadata = firstVertex * 4;
      const secondMetadata = secondVertex * 4;

      if (
        first.metadata[firstMetadata] === first.metadata[secondMetadata]
      ) {
        sameLaneCount += 1;
      }

      if (
        first.metadata[secondMetadata + 1] -
          first.metadata[firstMetadata + 1] ===
        1
      ) {
        adjacentPointCount += 1;
      }
    }

    expect(sameLaneCount).toBe(first.segmentCount);
    expect(adjacentPointCount).toBe(first.segmentCount);
    expect(first.metadata).not.toEqual(otherSeed.metadata);
  });

  it("mantém filamentos finitos, contínuos e não degenerados em todos os estados", () => {
    const filaments = createPhosphorFilamentTargetData(4_000, 0x435254);

    for (const state of filaments.states) {
      let nonDegenerateCount = 0;
      let continuousNeighborCount = 0;
      let neighborPairCount = 0;

      for (let segment = 0; segment < filaments.segmentCount; segment += 1) {
        const positionOffset = segment * 2 * 3;
        const dx = state[positionOffset + 3] - state[positionOffset];
        const dy = state[positionOffset + 4] - state[positionOffset + 1];
        const dz = state[positionOffset + 5] - state[positionOffset + 2];

        if (dx * dx + dy * dy + dz * dz > 1e-8) {
          nonDegenerateCount += 1;
        }

        if (segment + 1 < filaments.segmentCount) {
          const metadataOffset = segment * 2 * 4;
          const nextMetadataOffset = (segment + 1) * 2 * 4;

          if (
            filaments.metadata[metadataOffset] ===
            filaments.metadata[nextMetadataOffset]
          ) {
            neighborPairCount += 1;

            const nextPositionOffset = (segment + 1) * 2 * 3;
            if (
              state[positionOffset + 3] === state[nextPositionOffset] &&
              state[positionOffset + 4] === state[nextPositionOffset + 1] &&
              state[positionOffset + 5] === state[nextPositionOffset + 2]
            ) {
              continuousNeighborCount += 1;
            }
          }
        }
      }

      expect(Array.from(state).every(Number.isFinite)).toBe(true);
      expect(nonDegenerateCount).toBeGreaterThan(
        filaments.segmentCount * 0.99,
      );
      expect(continuousNeighborCount).toBe(neighborPairCount);
    }
  });

  it("rejeita contagens fora dos três tiers públicos", () => {
    expect(() =>
      createPhosphorFilamentTargetData(
        2_001 as Parameters<typeof createPhosphorFilamentTargetData>[0],
        0x435254,
      ),
    ).toThrow(RangeError);
  });
});
