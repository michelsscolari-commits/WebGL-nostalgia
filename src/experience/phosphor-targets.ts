export const PHOSPHOR_STATE_COUNT = 7;

export interface PhosphorTargetData {
  count: number;
  stateCount: typeof PHOSPHOR_STATE_COUNT;
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

function write(
  target: Float32Array,
  particleIndex: number,
  x: number,
  y: number,
  z: number,
): void {
  const offset = particleIndex * 3;
  target[offset] = x;
  target[offset + 1] = y;
  target[offset + 2] = z;
}

function signed(value: number): number {
  return value * 2 - 1;
}

export function createPhosphorTargetData(
  count: number,
  seed = 0x4f4c4454,
): PhosphorTargetData {
  if (!Number.isInteger(count) || count < 128) {
    throw new RangeError("count precisa ser um inteiro maior ou igual a 128");
  }

  const random = createRandom(seed);
  const states = Array.from(
    { length: PHOSPHOR_STATE_COUNT },
    () => new Float32Array(count * 3),
  );
  const metadata = new Float32Array(count * 4);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const u = (index + 0.5) / count;
    const r0 = random();
    const r1 = random();
    const r2 = random();
    const r3 = random();
    const r4 = random();
    const r5 = random();
    const gx = signed(r0);
    const gy = signed(r1);
    const angle = index * goldenAngle + r2 * 0.18;

    const metaOffset = index * 4;
    metadata[metaOffset] = r0;
    metadata[metaOffset + 1] = r1;
    metadata[metaOffset + 2] = r2;
    metadata[metaOffset + 3] = 0.55 + r3 * 0.45;

    // 00 — Sem sinal: tensão residual concentrada na antiga linha catódica.
    const residualRadius = 0.16 + Math.pow(r1, 2.8) * 3.6;
    write(
      states[0],
      index,
      Math.cos(angle) * residualRadius,
      Math.sin(angle) * residualRadius * 0.085 + signed(r4) * 0.035,
      signed(r5) * 2.7,
    );

    // 01 — Aquecimento: todos os elétrons passam pela mesma fenda horizontal.
    write(
      states[1],
      index,
      signed(u) * 5.2,
      signed(r1) * 0.075,
      signed(r2) * 0.95,
    );

    // 02 — Varredura: o feixe abre um raster curvo e discretizado em scanlines.
    const rasterY = Math.round(gy * 92) / 92;
    write(
      states[2],
      index,
      gx * 4.85,
      rasterY * 2.82,
      0.42 - (gx * gx * 0.52 + rasterY * rasterY * 0.34) + signed(r3) * 0.025,
    );

    // 03 — Memória alta: uma matriz de células com planos de endereço.
    const memoryColumn = index % 144;
    const memoryRow = Math.floor(index / 144) % 72;
    const memoryPlane = Math.floor(index / (144 * 72)) % 5;
    const memoryX = (memoryColumn / 143 - 0.5) * 9.45;
    const memoryY = (0.5 - memoryRow / 71) * 5.35;
    const cellGate = (memoryColumn + memoryRow * 3) % 11;
    write(
      states[3],
      index,
      memoryX + (cellGate < 2 ? 0.08 : 0),
      memoryY,
      (memoryPlane - 2) * 0.18 + Math.sin(memoryColumn * 0.19) * 0.08,
    );

    // 04 — Prompt: a mesma matriz curva para dentro como um terminal profundo.
    const terminalTheta = gx * 1.1;
    const terminalRadius = 4.4 + Math.sin(gy * 18 + r2 * 3) * 0.13;
    write(
      states[4],
      index,
      Math.sin(terminalTheta) * terminalRadius,
      gy * 3.05,
      Math.cos(terminalTheta) * terminalRadius - 3.75 + signed(r3) * 0.06,
    );

    // 05 — Barramento: trilhas ortogonais compartilham pulsos e profundidade.
    const horizontalBus = r0 < 0.68;
    const lane = Math.floor(r1 * 19) - 9;
    const branch = Math.floor(r2 * 9) - 4;
    write(
      states[5],
      index,
      horizontalBus ? signed(r3) * 5.05 : lane * 0.49,
      horizontalBus ? lane * 0.29 : signed(r3) * 2.85,
      branch * 0.16 + Math.sin(u * Math.PI * 18) * 0.06,
    );

    // 06 — Persistência: tela curva, eco profundo e moldura feitos da mesma matéria.
    if (r0 < 0.72) {
      const screenY = Math.round(gy * 108) / 108;
      write(
        states[6],
        index,
        gx * 4.72,
        screenY * 2.72,
        0.68 - (gx * gx * 0.58 + screenY * screenY * 0.42) + signed(r4) * 0.045,
      );
    } else if (r0 < 0.91) {
      write(
        states[6],
        index,
        gx * 4.52 + Math.sin(angle) * 0.16,
        gy * 2.58,
        -1.05 - r2 * 1.15,
      );
    } else {
      const perimeter = r1 * 4;
      const edge = perimeter % 1;
      const side = Math.floor(perimeter);
      const frameX = side === 0 ? signed(edge) * 4.84 : side === 2 ? -signed(edge) * 4.84 : side === 1 ? 4.84 : -4.84;
      const frameY = side === 1 ? signed(edge) * 2.82 : side === 3 ? -signed(edge) * 2.82 : side === 0 ? 2.82 : -2.82;
      write(states[6], index, frameX, frameY, -0.22 + signed(r3) * 0.16);
    }
  }

  return {
    count,
    stateCount: PHOSPHOR_STATE_COUNT,
    states,
    metadata,
  };
}
