import type { World } from "../../sim";
import type { Creature } from "../../sim/entities/Creature";
import { IntelCreature } from "../../sim/entities/IntelCreature";
import { positionKey, type Position } from "../../sim/entities/types";
import type { OverlaySettings } from "../../state/useSimulationController";

export interface ClassicSceneCell {
  key: string;
  position: Position;
  fertility: number;
  memoryHighlighted: boolean;
  plantMemoryHighlighted: boolean;
  creatureMemoryHighlighted: boolean;
  pinnedHighlighted: boolean;
  selectedHighlighted: boolean;
  observedHighlighted: boolean;
  targetHighlighted: boolean;
  previousHighlighted: boolean;
  facingHighlighted: boolean;
  linkedHighlighted: boolean;
  creatureCount: number;
  plantMemories: Array<{
    plantId: string;
    type: string;
    confidence: number;
    lastSeenTicksAgo: number;
  }>;
  creatureMemories: Array<{
    creatureId: string;
    kind: Creature["kind"];
    confidence: number;
    lastSeenTicksAgo: number;
  }>;
  intentSources: Array<{
    creatureId: string;
    selected: boolean;
  }>;
  creatures: Array<{
    id: string;
    kind: Creature["kind"];
    energy: number;
    mode: Creature["mode"];
    selected: boolean;
  }>;
  plants: Array<{
    id: string;
    type: string;
    energy: number;
  }>;
}

export interface ClassicSceneCreature {
  id: string;
  kind: Creature["kind"];
  mode: Creature["mode"];
  position: Position;
  energy: number;
  energyRatio: number;
  energyState: "low" | "steady" | "surplus";
  selected: boolean;
  debugLabel: string;
}

export interface ClassicSceneRelationship {
  key: string;
  from: Position;
  to: Position;
}

export interface ClassicSceneIntent {
  key: string;
  creatureId: string;
  from: Position;
  to: Position;
  selected: boolean;
}

export interface ClassicSceneFocus {
  creatureId: string;
  position: Position;
  previousPosition: Position;
  facing: Creature["facing"];
  facingPosition: Position;
  targetPosition: Position | null;
  linkedPosition: Position | null;
  energy: number;
  mode: Creature["mode"];
}

export interface ClassicScene {
  cells: ClassicSceneCell[];
  creatures: ClassicSceneCreature[];
  intents: ClassicSceneIntent[];
  relationships: ClassicSceneRelationship[];
  focus: ClassicSceneFocus | null;
}

export function buildClassicScene(
  world: World,
  overlays: OverlaySettings,
  selectedCreatureId: string | null,
  selectedCell: Position | null = null,
): ClassicScene {
  const selectedCreature = world.getCreature(selectedCreatureId);
  const observationRange =
    selectedCreature instanceof IntelCreature
      ? world.config.intel.observationRange
      : 0;
  const observedCells = new Set(
    selectedCreature
      ? world.grid
          .ahead(selectedCreature.position, selectedCreature.facing, observationRange)
          .map((position) => positionKey(position))
      : [],
  );
  const memoryCells = new Set(
    selectedCreature instanceof IntelCreature && overlays.memory
      ? selectedCreature.plantMemory.map((entry) => positionKey(entry.position))
      : [],
  );
  const creatureMemoryCells = new Set(
    selectedCreature instanceof IntelCreature && overlays.memory
      ? selectedCreature.creatureMemory.map((entry) => positionKey(entry.position))
      : [],
  );
  const selectedCellKey = selectedCreature
    ? positionKey(selectedCreature.position)
    : null;
  const previousCellKey = selectedCreature
    ? positionKey(selectedCreature.previousPosition)
    : null;
  const pinnedCellKey = selectedCell ? positionKey(selectedCell) : null;
  const desiredPlantPosition =
    selectedCreature instanceof IntelCreature
      ? world.getPlant(selectedCreature.desiredPlantId)?.position ?? null
      : null;
  const targetCellKey = desiredPlantPosition ? positionKey(desiredPlantPosition) : null;
  const facingCellKey = selectedCreature
    ? positionKey(
        world.grid.ahead(selectedCreature.position, selectedCreature.facing, 1)[1] ??
          selectedCreature.position,
      )
    : null;
  const linkedCreature =
    selectedCreature instanceof IntelCreature
      ? world.getCreature(selectedCreature.partnerId ?? selectedCreature.leaderId)
      : null;
  const linkedCellKey = linkedCreature ? positionKey(linkedCreature.position) : null;
  const aliveCreatures = world.creatures.filter((creature) => creature.alive);

  const cells: ClassicSceneCell[] = [];
  for (let y = 0; y < world.grid.height; y += 1) {
    for (let x = 0; x < world.grid.width; x += 1) {
      const position = { x, y };
      const key = positionKey(position);
      const plantMemories =
        selectedCreature instanceof IntelCreature && overlays.memory
          ? selectedCreature.plantMemory
              .filter((entry) => entry.position.x === x && entry.position.y === y)
              .map((entry) => ({
                plantId: entry.plantId,
                type: entry.type,
                confidence: entry.confidence,
                lastSeenTicksAgo: Math.max(0, world.tick - entry.lastSeenTick),
              }))
          : [];
      const creatureMemories =
        selectedCreature instanceof IntelCreature && overlays.memory
          ? selectedCreature.creatureMemory
              .filter((entry) => entry.position.x === x && entry.position.y === y)
              .map((entry) => ({
                creatureId: entry.creatureId,
                kind: entry.kind,
                confidence: entry.confidence,
                lastSeenTicksAgo: Math.max(0, world.tick - entry.lastSeenTick),
              }))
          : [];
      const creatures = aliveCreatures
        .filter((creature) => creature.position.x === x && creature.position.y === y)
        .map((creature) => ({
          id: creature.id,
          kind: creature.kind,
          energy: creature.energy,
          mode: creature.mode,
          selected: creature.id === selectedCreatureId,
        }));
      cells.push({
        key,
        position,
        fertility: world.getFertility(position),
        memoryHighlighted: memoryCells.has(key) || creatureMemoryCells.has(key),
        plantMemoryHighlighted: memoryCells.has(key),
        creatureMemoryHighlighted: creatureMemoryCells.has(key),
        pinnedHighlighted: pinnedCellKey === key,
        selectedHighlighted: selectedCellKey === key,
        observedHighlighted: observedCells.has(key),
        targetHighlighted: targetCellKey === key,
        previousHighlighted: previousCellKey === key,
        facingHighlighted: facingCellKey === key,
        linkedHighlighted: linkedCellKey === key,
        creatureCount: creatures.length,
        plantMemories,
        creatureMemories,
        intentSources: overlays.intent
          ? aliveCreatures
              .filter((creature): creature is IntelCreature => creature instanceof IntelCreature)
              .filter((creature) => {
                const target = world.getPlant(creature.desiredPlantId);
                return target?.position.x === x && target.position.y === y;
              })
              .map((creature) => ({
                creatureId: creature.id,
                selected: creature.id === selectedCreatureId,
              }))
          : [],
        creatures,
        plants: world.plants
          .filter((plant) => plant.position.x === x && plant.position.y === y)
          .map((plant) => ({
            id: plant.id,
            type: plant.type,
            energy: plant.energy,
          })),
      });
    }
  }

  return {
    cells,
    creatures: aliveCreatures.map((creature) => ({
      id: creature.id,
      kind: creature.kind,
      mode: creature.mode,
      position: creature.position,
      energy: creature.energy,
      energyRatio: Math.max(0, creature.energy / Math.max(1, world.config.initialCreatureEnergy)),
      energyState:
        creature.energy < world.config.hungerThreshold
          ? "low"
          : creature.energy > world.config.initialCreatureEnergy
            ? "surplus"
            : "steady",
      selected: creature.id === selectedCreatureId,
      debugLabel: creature.id.replace("c", ""),
    })),
    intents: overlays.intent
      ? aliveCreatures
          .filter((creature): creature is IntelCreature => creature instanceof IntelCreature)
          .map((creature) => {
            const target = world.getPlant(creature.desiredPlantId);
            if (!target) {
              return null;
            }
            return {
              key: `${creature.id}-${target.id}`,
              creatureId: creature.id,
              from: creature.position,
              to: target.position,
              selected: creature.id === selectedCreatureId,
            };
          })
          .filter((intent): intent is ClassicSceneIntent => intent !== null)
      : [],
    relationships: overlays.relationships
      ? world.creatures
          .filter(
            (creature): creature is IntelCreature =>
              creature instanceof IntelCreature &&
              creature.partnerId !== null &&
              world.getCreature(creature.partnerId)?.alive === true,
          )
          .map((leader) => {
            const partner = world.getCreature(leader.partnerId);
            if (!partner) {
              return null;
            }
            return {
              key: `${leader.id}-${partner.id}`,
              from: leader.position,
              to: partner.position,
            };
          })
          .filter((relationship): relationship is ClassicSceneRelationship => relationship !== null)
      : [],
    focus: selectedCreature
      ? {
          creatureId: selectedCreature.id,
          position: selectedCreature.position,
          previousPosition: selectedCreature.previousPosition,
          facing: selectedCreature.facing,
          facingPosition: world.grid.ahead(
            selectedCreature.position,
            selectedCreature.facing,
            1,
          )[1] ?? selectedCreature.position,
          targetPosition: desiredPlantPosition,
          linkedPosition: linkedCreature?.position ?? null,
          energy: selectedCreature.energy,
          mode: selectedCreature.mode,
        }
      : null,
  };
}
