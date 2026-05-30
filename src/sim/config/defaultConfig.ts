import type {
  ComboType,
  PlantType,
  SimulationMode,
} from "../entities/types";

export interface CreatureCostConfig {
  movementCost: number;
  stayCost: number;
  maxInventory: number;
}

export interface IntelCreatureConfig extends CreatureCostConfig {
  plantMemory: number;
  creatureMemory: number;
  observationRange: number;
  startsInObservation: boolean;
  communicationEnabled: boolean;
  partnershipMinComboEnergy: number;
}

export interface AdvancedConfig {
  terrainEnabled: boolean;
  seasonalCycleLength: number;
  fertilityRegrowthRate: number;
  memoryDecayPerTick: number;
  groupSizeLimit: number;
  strategy: {
    cooperation: number;
    exploration: number;
    exploitation: number;
    riskAppetite: number;
    memoryTrust: number;
    energyReserve: number;
  };
}

export interface SimulationConfig {
  seed: string | number;
  mode: SimulationMode;
  grid: {
    width: number;
    height: number;
    legacyCellPixels: number;
  };
  targetPlantPopulation: number;
  plantSetMaxSize: number;
  enabledPlantTypes: number;
  plantEnergy: Record<PlantType, number>;
  combinationEnergy: Record<ComboType, number>;
  hungerThreshold: number;
  initialCreatureEnergy: number;
  simple: CreatureCostConfig;
  intel: IntelCreatureConfig;
  advanced: AdvancedConfig;
}

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export const DEFAULT_CONFIG: SimulationConfig = {
  seed: "agentworld",
  mode: "classic",
  grid: {
    width: 5,
    height: 5,
    legacyCellPixels: 100,
  },
  targetPlantPopulation: 25,
  plantSetMaxSize: 4,
  enabledPlantTypes: 4,
  plantEnergy: {
    green: 100,
    red: 50,
    yellow: 70,
    magenta: 90,
  },
  combinationEnergy: {
    "green-red": 450,
    "yellow-red": 420,
    "magenta-yellow": 400,
  },
  hungerThreshold: 50,
  initialCreatureEnergy: 100,
  simple: {
    movementCost: 7,
    stayCost: 5,
    maxInventory: 4,
  },
  intel: {
    movementCost: 15,
    stayCost: 10,
    maxInventory: 4,
    plantMemory: 20,
    creatureMemory: 20,
    observationRange: 1,
    startsInObservation: true,
    communicationEnabled: true,
    partnershipMinComboEnergy: 400,
  },
  advanced: {
    terrainEnabled: false,
    seasonalCycleLength: 120,
    fertilityRegrowthRate: 0.02,
    memoryDecayPerTick: 0.01,
    groupSizeLimit: 5,
    strategy: {
      cooperation: 1,
      exploration: 1,
      exploitation: 1,
      riskAppetite: 1,
      memoryTrust: 1,
      energyReserve: 1,
    },
  },
};

export function createSimulationConfig(
  overrides: DeepPartial<SimulationConfig> = {},
): SimulationConfig {
  return mergeConfig(DEFAULT_CONFIG, overrides);
}

function mergeConfig<T extends object>(
  base: T,
  overrides: DeepPartial<T>,
): T {
  const result = { ...base } as T;

  for (const key of Object.keys(overrides) as Array<keyof T>) {
    const value = overrides[key];
    const baseValue = result[key];
    if (
      isPlainRecord(value) &&
      isPlainRecord(baseValue)
    ) {
      result[key] = mergeConfig(
        baseValue,
        value as DeepPartial<Record<string, unknown>>,
      ) as T[typeof key];
    } else if (value !== undefined) {
      result[key] = value as T[typeof key];
    }
  }

  return result;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
