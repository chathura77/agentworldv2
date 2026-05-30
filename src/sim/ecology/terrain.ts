import type { Position } from "../entities/types";

export type TerrainType = "fertile" | "plain" | "barren" | "water" | "obstacle";

export interface TerrainCell {
  position: Position;
  type: TerrainType;
  fertility: number;
  movementCostMultiplier: number;
  passable: boolean;
}

export function createPlainTerrain(position: Position): TerrainCell {
  return {
    position,
    type: "plain",
    fertility: 1,
    movementCostMultiplier: 1,
    passable: true,
  };
}

export function createTerrainCell(
  seed: string | number,
  position: Position,
  width: number,
  height: number,
): TerrainCell {
  const normalizedX = width <= 1 ? 0 : position.x / (width - 1);
  const normalizedY = height <= 1 ? 0 : position.y / (height - 1);
  const centerBias =
    1 - Math.min(1, Math.abs(normalizedX - 0.5) + Math.abs(normalizedY - 0.5));
  const noise = coordinateNoise(seed, position.x, position.y);
  const fertility = clamp(0.45 + centerBias * 0.45 + noise * 0.55, 0.25, 1.5);

  if (fertility >= 1.18) {
    return {
      position,
      type: "fertile",
      fertility,
      movementCostMultiplier: 0.95,
      passable: true,
    };
  }

  if (fertility <= 0.72) {
    return {
      position,
      type: "barren",
      fertility,
      movementCostMultiplier: 1.08,
      passable: true,
    };
  }

  return {
    position,
    type: "plain",
    fertility,
    movementCostMultiplier: 1,
    passable: true,
  };
}

function coordinateNoise(seed: string | number, x: number, y: number): number {
  const seedValue = typeof seed === "number" ? seed : hashString(seed);
  let hash = seedValue ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  hash ^= hash >>> 16;
  return ((hash >>> 0) / 4294967295) * 2 - 1;
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
