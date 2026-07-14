export interface DocumentProgressInput {
  scrollY: number;
  scrollHeight: number;
  viewportHeight: number;
}

export interface ScrollPhase {
  from: number;
  to: number;
  localProgress: number;
}

export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function getDocumentProgress({
  scrollY,
  scrollHeight,
  viewportHeight,
}: DocumentProgressInput): number {
  const scrollableDistance = Math.max(0, scrollHeight - viewportHeight);
  if (scrollableDistance === 0) return 0;
  return clamp01(scrollY / scrollableDistance);
}

export function resolveScrollPhase(
  progress: number,
  stateCount: number,
): ScrollPhase {
  if (!Number.isInteger(stateCount) || stateCount < 2) {
    throw new RangeError("stateCount precisa ser um inteiro maior ou igual a 2");
  }

  const boundedProgress = clamp01(progress);
  if (boundedProgress === 1) {
    const last = stateCount - 1;
    return { from: last, to: last, localProgress: 0 };
  }

  const scaled = boundedProgress * (stateCount - 1);
  const from = Math.floor(scaled);
  return {
    from,
    to: from + 1,
    localProgress: scaled - from,
  };
}

export function resolveAnchoredProgress(
  scrollPosition: number,
  anchors: readonly number[],
): number {
  if (anchors.length < 2) {
    throw new RangeError("anchors precisa conter ao menos dois capítulos");
  }

  for (let index = 0; index < anchors.length; index += 1) {
    if (!Number.isFinite(anchors[index])) {
      throw new RangeError("todos os anchors precisam ser finitos");
    }
    if (index > 0 && anchors[index] <= anchors[index - 1]) {
      throw new RangeError("anchors precisam estar em ordem crescente");
    }
  }

  if (scrollPosition <= anchors[0]) return 0;
  const lastIndex = anchors.length - 1;
  if (scrollPosition >= anchors[lastIndex]) return 1;

  for (let index = 0; index < lastIndex; index += 1) {
    const start = anchors[index];
    const end = anchors[index + 1];
    if (scrollPosition <= end) {
      const localProgress = (scrollPosition - start) / (end - start);
      return (index + localProgress) / lastIndex;
    }
  }

  return 1;
}

export function smootherstep(value: number): number {
  const x = clamp01(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
}
