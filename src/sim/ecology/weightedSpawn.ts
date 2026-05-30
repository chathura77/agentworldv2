import type { Position } from "../entities/types";

export function chooseWeightedIndex(
  randomValue: number,
  weights: number[],
): number {
  const sanitized = weights.map((weight) =>
    Number.isFinite(weight) && weight > 0 ? weight : 0,
  );
  const total = sanitized.reduce((sum, weight) => sum + weight, 0);

  if (total <= 0) {
    return 0;
  }

  let remaining = randomValue * total;
  for (let index = 0; index < sanitized.length; index += 1) {
    remaining -= sanitized[index];
    if (remaining <= 0) {
      return index;
    }
  }

  return sanitized.length - 1;
}

export function flattenWeightedPositions(
  fertility: number[][],
): Array<{ position: Position; weight: number }> {
  const positions: Array<{ position: Position; weight: number }> = [];

  for (let y = 0; y < fertility.length; y += 1) {
    for (let x = 0; x < fertility[y].length; x += 1) {
      positions.push({
        position: { x, y },
        weight: Math.max(0.05, fertility[y][x] ?? 0),
      });
    }
  }

  return positions;
}
