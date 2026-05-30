import { clonePosition, type PlantType, type Position } from "../entities/types";

export interface PlantMemory {
  plantId: string;
  type: PlantType;
  position: Position;
  lastSeenTick: number;
  confidence: number;
}

export interface CreatureMemory {
  creatureId: string;
  kind: "simple" | "intel";
  position: Position;
  lastSeenTick: number;
  confidence: number;
}

export function rememberPlant(
  memory: PlantMemory[],
  entry: PlantMemory,
  limit: number,
): void {
  const existing = memory.find((item) => item.plantId === entry.plantId);
  if (existing) {
    existing.position = clonePosition(entry.position);
    existing.lastSeenTick = entry.lastSeenTick;
    existing.confidence = entry.confidence;
    return;
  }

  memory.push({
    ...entry,
    position: clonePosition(entry.position),
  });

  while (memory.length > limit) {
    memory.shift();
  }
}

export function rememberCreature(
  memory: CreatureMemory[],
  entry: CreatureMemory,
  limit: number,
): void {
  const existing = memory.find((item) => item.creatureId === entry.creatureId);
  if (existing) {
    existing.position = clonePosition(entry.position);
    existing.lastSeenTick = entry.lastSeenTick;
    existing.confidence = entry.confidence;
    return;
  }

  memory.push({
    ...entry,
    position: clonePosition(entry.position),
  });

  while (memory.length > limit) {
    memory.shift();
  }
}

