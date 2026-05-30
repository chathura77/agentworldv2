import type { SimulationConfig } from "../config/defaultConfig";
import type { Plant } from "../entities/Plant";
import type { ComboType, PlantType } from "../entities/types";

export interface ComboDefinition {
  combo: ComboType;
  plants: readonly [PlantType, PlantType];
}

export interface ComboMatch {
  combo: ComboType;
  amount: number;
  plantIds: [string, string];
}

export const COMBO_DEFINITIONS: ComboDefinition[] = [
  { combo: "green-red", plants: ["green", "red"] },
  { combo: "yellow-red", plants: ["yellow", "red"] },
  { combo: "magenta-yellow", plants: ["magenta", "yellow"] },
];

export function comboForTypes(a: PlantType, b: PlantType): ComboType | null {
  const match = COMBO_DEFINITIONS.find(
    (definition) =>
      (definition.plants[0] === a && definition.plants[1] === b) ||
      (definition.plants[0] === b && definition.plants[1] === a),
  );
  return match?.combo ?? null;
}

export function findBestCombo(
  inventory: readonly Plant[],
  config: SimulationConfig,
  requiredPlantId?: string,
): ComboMatch | null {
  const matches: ComboMatch[] = [];

  for (const definition of COMBO_DEFINITIONS) {
    const first = inventory.find((plant) => plant.type === definition.plants[0]);
    const second = inventory.find(
      (plant) => plant.type === definition.plants[1] && plant.id !== first?.id,
    );

    if (!first || !second) {
      continue;
    }

    if (requiredPlantId && first.id !== requiredPlantId && second.id !== requiredPlantId) {
      continue;
    }

    matches.push({
      combo: definition.combo,
      amount: config.combinationEnergy[definition.combo],
      plantIds: [first.id, second.id],
    });
  }

  matches.sort((a, b) => b.amount - a.amount);
  return matches[0] ?? null;
}

export function findComboWithPlant(
  inventory: readonly Plant[],
  plantType: PlantType,
  config: SimulationConfig,
): ComboMatch | null {
  const candidates: ComboMatch[] = [];

  for (const carried of inventory) {
    const combo = comboForTypes(carried.type, plantType);
    if (!combo) {
      continue;
    }
    candidates.push({
      combo,
      amount: config.combinationEnergy[combo],
      plantIds: [carried.id, ""],
    });
  }

  candidates.sort((a, b) => b.amount - a.amount);
  return candidates[0] ?? null;
}

export function consumeCombo(inventory: Plant[], match: ComboMatch): Plant[] {
  const consumed: Plant[] = [];

  for (const id of match.plantIds) {
    if (!id) {
      continue;
    }
    const index = inventory.findIndex((plant) => plant.id === id);
    if (index !== -1) {
      consumed.push(inventory.splice(index, 1)[0]);
    }
  }

  return consumed;
}

export function findSharedCombo(
  left: readonly Plant[],
  right: readonly Plant[],
  config: SimulationConfig,
): ComboMatch | null {
  const matches: ComboMatch[] = [];

  for (const leftPlant of left) {
    for (const rightPlant of right) {
      const combo = comboForTypes(leftPlant.type, rightPlant.type);
      if (!combo) {
        continue;
      }
      matches.push({
        combo,
        amount: config.combinationEnergy[combo],
        plantIds: [leftPlant.id, rightPlant.id],
      });
    }
  }

  matches.sort((a, b) => b.amount - a.amount);
  return matches[0] ?? null;
}

