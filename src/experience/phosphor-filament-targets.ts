export const PHOSPHOR_FILAMENT_STATES = [
  "residual",
  "beam",
  "raster",
  "bios",
  "terminal",
  "bus",
  "persistence",
] as const;

export const PHOSPHOR_FILAMENT_STATE_COUNT =
  PHOSPHOR_FILAMENT_STATES.length;

export type PhosphorFilamentSegmentCount = 2_000 | 4_000 | 8_000;

export interface PhosphorFilamentTargetData {
  segmentCount: PhosphorFilamentSegmentCount;
  vertexCount: number;
  stateCount: typeof PHOSPHOR_FILAMENT_STATE_COUNT;
  states: readonly Float32Array[];
  metadata: Float32Array;
}

type RandomSource = () => number;

function createRandom(seed: number): RandomSource {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function laneCountFor(segmentCount: PhosphorFilamentSegmentCount): number {
  if (segmentCount === 2_000) {
    return 32;
  }

  if (segmentCount === 4_000) {
    return 48;
  }

  return 64;
}

function writePosition(
  target: Float32Array,
  vertexIndex: number,
  x: number,
  y: number,
  z: number,
): void {
  const offset = vertexIndex * 3;
  target[offset] = x;
  target[offset + 1] = y;
  target[offset + 2] = z;
}

function writeFilamentVertex(
  states: readonly Float32Array[],
  vertexIndex: number,
  lane: number,
  laneCount: number,
  t: number,
  phase: number,
  energy: number,
  variant: number,
  depth: number,
): void {
  const tau = Math.PI * 2;
  const centeredT = t * 2 - 1;
  const signedLane = (lane / (laneCount - 1)) * 2 - 1;
  const phaseAngle = phase * tau;
  const laneWave = Math.sin(t * tau * (2 + Math.floor(phase * 3)) + phaseAngle);

  // 00 — Residual: carga remanescente pulsa perto da antiga linha catódica.
  const residualReach = 1.25 + phase * 2.75;
  writePosition(
    states[0],
    vertexIndex,
    centeredT * residualReach,
    signedLane * 0.075 + laneWave * 0.028 * energy,
    signedLane * 1.55 + Math.cos(t * tau * 2 + phaseAngle) * 0.12,
  );

  // 01 — Beam: as lanes comprimem-se no mesmo feixe de aquecimento.
  writePosition(
    states[1],
    vertexIndex,
    centeredT * 5.15,
    signedLane * 0.055 + Math.sin(t * Math.PI + phaseAngle) * 0.012,
    signedLane * 0.48 + laneWave * 0.025,
  );

  // 02 — Raster: cada lane torna-se uma scanline sobre a curvatura do tubo.
  const rasterX = centeredT * 4.85;
  const rasterY = signedLane * 2.75;
  writePosition(
    states[2],
    vertexIndex,
    rasterX,
    rasterY,
    0.48 - rasterX * rasterX * 0.024 - rasterY * rasterY * 0.038 + laneWave * 0.014,
  );

  // 03 — BIOS: o raster organiza-se em bancos de endereço e pulsos POST.
  const addressPulse = (Math.floor(t * 24) + lane * 3) % 7 === 0 ? 0.07 : 0;
  writePosition(
    states[3],
    vertexIndex,
    centeredT * 4.68,
    signedLane * 2.62 + addressPulse,
    ((lane % 7) - 3) * 0.052 + Math.sin(t * tau * 3 + phaseAngle) * 0.032,
  );

  // 04 — Terminal: os bancos curvam-se para dentro como um terminal profundo.
  const terminalTheta = centeredT * 1.08;
  const terminalRadius = 4.72 + (energy - 0.775) * 0.18;
  writePosition(
    states[4],
    vertexIndex,
    Math.sin(terminalTheta) * terminalRadius,
    signedLane * 2.72 + laneWave * 0.018,
    Math.cos(terminalTheta) * terminalRadius - 4.08 + signedLane * 0.035,
  );

  // 05 — Bus: lanes horizontais e verticais cruzam-se sem conexões aleatórias.
  const horizontalBus = variant < 0.68;
  const busDepth = (Math.floor(depth * 7) - 3) * 0.15;
  writePosition(
    states[5],
    vertexIndex,
    horizontalBus
      ? centeredT * 5.02
      : signedLane * 4.42 + laneWave * 0.045,
    horizontalBus
      ? signedLane * 2.48 + laneWave * 0.04
      : centeredT * 2.82,
    busDepth + Math.sin(t * tau * 4 + phaseAngle) * 0.035,
  );

  // 06 — Persistence: scanlines, retrace e moldura coexistem no mesmo CRT vivo.
  if (variant < 0.82) {
    const persistenceX = centeredT * 4.75;
    const persistenceY = signedLane * 2.72;
    const echoDepth = depth > 0.74 ? 0.72 + (depth - 0.74) * 2.4 : 0;
    writePosition(
      states[6],
      vertexIndex,
      persistenceX,
      persistenceY,
      0.7 -
        persistenceX * persistenceX * 0.026 -
        persistenceY * persistenceY * 0.04 -
        echoDepth +
        laneWave * 0.018,
    );
  } else if (variant < 0.93) {
    const retraceX = signedLane * 4.62;
    const retraceY = centeredT * 2.72;
    writePosition(
      states[6],
      vertexIndex,
      retraceX,
      retraceY,
      0.62 - retraceX * retraceX * 0.025 - retraceY * retraceY * 0.04,
    );
  } else {
    const perimeter = Math.min(t * 4, 3.999_999);
    const side = Math.floor(perimeter);
    const edge = perimeter - side;
    const frameX =
      side === 0
        ? -4.78 + edge * 9.56
        : side === 1
          ? 4.78
          : side === 2
            ? 4.78 - edge * 9.56
            : -4.78;
    const frameY =
      side === 0
        ? 2.75
        : side === 1
          ? 2.75 - edge * 5.5
          : side === 2
            ? -2.75
            : -2.75 + edge * 5.5;

    writePosition(
      states[6],
      vertexIndex,
      frameX,
      frameY,
      -0.2 + signedLane * 0.08,
    );
  }
}

export function createPhosphorFilamentTargetData(
  segmentCount: PhosphorFilamentSegmentCount,
  seed: number,
): PhosphorFilamentTargetData {
  if (
    segmentCount !== 2_000 &&
    segmentCount !== 4_000 &&
    segmentCount !== 8_000
  ) {
    throw new RangeError("segmentCount precisa ser 2000, 4000 ou 8000");
  }

  const vertexCount = segmentCount * 2;
  const states = Array.from(
    { length: PHOSPHOR_FILAMENT_STATE_COUNT },
    () => new Float32Array(vertexCount * 3),
  );
  const metadata = new Float32Array(vertexCount * 4);
  const laneCount = laneCountFor(segmentCount);
  const baseSegmentsPerLane = Math.floor(segmentCount / laneCount);
  const lanesWithExtraSegment = segmentCount % laneCount;
  const random = createRandom(seed);
  let segmentIndex = 0;

  for (let lane = 0; lane < laneCount; lane += 1) {
    const segmentsInLane =
      baseSegmentsPerLane + (lane < lanesWithExtraSegment ? 1 : 0);
    const phase = random();
    const energy = 0.55 + random() * 0.45;
    const variant = random();
    const depth = random();

    for (let localSegment = 0; localSegment < segmentsInLane; localSegment += 1) {
      const firstVertex = segmentIndex * 2;
      const secondVertex = firstVertex + 1;
      const firstMetadata = firstVertex * 4;
      const secondMetadata = firstMetadata + 4;

      writeFilamentVertex(
        states,
        firstVertex,
        lane,
        laneCount,
        localSegment / segmentsInLane,
        phase,
        energy,
        variant,
        depth,
      );
      writeFilamentVertex(
        states,
        secondVertex,
        lane,
        laneCount,
        (localSegment + 1) / segmentsInLane,
        phase,
        energy,
        variant,
        depth,
      );

      metadata[firstMetadata] = lane;
      metadata[firstMetadata + 1] = localSegment;
      metadata[firstMetadata + 2] = phase;
      metadata[firstMetadata + 3] = energy;

      metadata[secondMetadata] = lane;
      metadata[secondMetadata + 1] = localSegment + 1;
      metadata[secondMetadata + 2] = phase;
      metadata[secondMetadata + 3] = energy;

      segmentIndex += 1;
    }
  }

  return {
    segmentCount,
    vertexCount,
    stateCount: PHOSPHOR_FILAMENT_STATE_COUNT,
    states,
    metadata,
  };
}
