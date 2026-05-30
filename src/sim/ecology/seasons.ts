import type { PlantType } from "../entities/types";

export type SeasonName = "spring" | "summer" | "autumn" | "winter";

export interface SeasonState {
  name: SeasonName;
  index: number;
  progress: number;
  plantWeights: Record<PlantType, number>;
  energyMultiplier: number;
}

const SEASONS: SeasonState[] = [
  {
    name: "spring",
    index: 0,
    progress: 0,
    plantWeights: {
      green: 1.45,
      red: 0.9,
      yellow: 1.15,
      magenta: 0.85,
    },
    energyMultiplier: 1.05,
  },
  {
    name: "summer",
    index: 1,
    progress: 0,
    plantWeights: {
      green: 1,
      red: 0.95,
      yellow: 1.35,
      magenta: 1.1,
    },
    energyMultiplier: 1,
  },
  {
    name: "autumn",
    index: 2,
    progress: 0,
    plantWeights: {
      green: 0.95,
      red: 1.35,
      yellow: 0.9,
      magenta: 1.15,
    },
    energyMultiplier: 1.1,
  },
  {
    name: "winter",
    index: 3,
    progress: 0,
    plantWeights: {
      green: 0.8,
      red: 1.05,
      yellow: 0.75,
      magenta: 1.3,
    },
    energyMultiplier: 0.9,
  },
];

export function getSeasonState(
  tick: number,
  seasonalCycleLength: number,
): SeasonState {
  const cycleLength = Math.max(4, seasonalCycleLength);
  const seasonLength = cycleLength / SEASONS.length;
  const cycleTick = ((tick % cycleLength) + cycleLength) % cycleLength;
  const rawIndex = Math.floor(cycleTick / seasonLength);
  const index = Math.min(SEASONS.length - 1, rawIndex);
  const base = SEASONS[index];
  const seasonStart = index * seasonLength;
  const progress =
    seasonLength === 0 ? 0 : (cycleTick - seasonStart) / seasonLength;

  return {
    ...base,
    progress,
  };
}
