import type { World } from "../../sim";
import { IntelCreature } from "../../sim/entities/IntelCreature";
import type { Position } from "../../sim/entities/types";
import type { OverlaySettings } from "../../state/useSimulationController";

export interface AdvancedFertilityCell {
  position: Position;
  fertility: number;
}

export interface AdvancedOverlayLine {
  key: string;
  from: Position;
  to: Position;
  kind: "intent" | "relationship" | "previous" | "facing" | "target" | "linked";
  selected: boolean;
}

export interface AdvancedMemoryMarker {
  key: string;
  position: Position;
  confidence: number;
  kind: "plant" | "creature";
}

export interface AdvancedFocusMarker {
  current: Position;
  previous: Position;
  facing: Position;
}

export interface AdvancedOverlayScene {
  fertilityCells: AdvancedFertilityCell[];
  lines: AdvancedOverlayLine[];
  memoryMarkers: AdvancedMemoryMarker[];
  focusMarker: AdvancedFocusMarker | null;
}

export function buildAdvancedOverlayScene(
  world: World,
  overlays: OverlaySettings,
  selectedCreatureId: string | null,
): AdvancedOverlayScene {
  const selectedCreature = world.getCreature(selectedCreatureId);
  const aliveCreatures = world.creatures.filter((creature) => creature.alive);
  const lines: AdvancedOverlayLine[] = [];

  if (overlays.intent) {
    for (const creature of aliveCreatures) {
      if (!(creature instanceof IntelCreature) || !creature.desiredPlantId) {
        continue;
      }
      const target = world.getPlant(creature.desiredPlantId);
      if (!target) {
        continue;
      }
      lines.push({
        key: `${creature.id}-${target.id}`,
        from: creature.position,
        to: target.position,
        kind: "intent",
        selected: creature.id === selectedCreatureId,
      });
    }
  }

  if (overlays.relationships) {
    for (const creature of aliveCreatures) {
      if (!(creature instanceof IntelCreature) || !creature.partnerId) {
        continue;
      }
      const partner = world.getCreature(creature.partnerId);
      if (!partner?.alive) {
        continue;
      }
      lines.push({
        key: `${creature.id}-${partner.id}`,
        from: creature.position,
        to: partner.position,
        kind: "relationship",
        selected:
          creature.id === selectedCreatureId || partner.id === selectedCreatureId,
      });
    }
  }

  let focusMarker: AdvancedFocusMarker | null = null;
  if (overlays.debug && selectedCreature) {
    const facing =
      world.grid.ahead(selectedCreature.position, selectedCreature.facing, 1)[1] ??
      selectedCreature.position;
    focusMarker = {
      current: selectedCreature.position,
      previous: selectedCreature.previousPosition,
      facing,
    };
    lines.push({
      key: `${selectedCreature.id}-previous`,
      from: selectedCreature.previousPosition,
      to: selectedCreature.position,
      kind: "previous",
      selected: true,
    });
    lines.push({
      key: `${selectedCreature.id}-facing`,
      from: selectedCreature.position,
      to: facing,
      kind: "facing",
      selected: true,
    });

    if (selectedCreature instanceof IntelCreature) {
      const target = world.getPlant(selectedCreature.desiredPlantId);
      if (target) {
        lines.push({
          key: `${selectedCreature.id}-target`,
          from: selectedCreature.position,
          to: target.position,
          kind: "target",
          selected: true,
        });
      }

      const linked = world.getCreature(
        selectedCreature.partnerId ?? selectedCreature.leaderId,
      );
      if (linked?.alive) {
        lines.push({
          key: `${selectedCreature.id}-linked`,
          from: selectedCreature.position,
          to: linked.position,
          kind: "linked",
          selected: true,
        });
      }
    }
  }

  const memoryMarkers: AdvancedMemoryMarker[] = [];
  if (overlays.memory && selectedCreature instanceof IntelCreature) {
    for (const memory of selectedCreature.plantMemory) {
      memoryMarkers.push({
        key: `plant-${memory.plantId}`,
        position: memory.position,
        confidence: memory.confidence,
        kind: "plant",
      });
    }
    for (const memory of selectedCreature.creatureMemory) {
      memoryMarkers.push({
        key: `creature-${memory.creatureId}`,
        position: memory.position,
        confidence: memory.confidence,
        kind: "creature",
      });
    }
  }

  const fertilityCells: AdvancedFertilityCell[] = [];
  if (overlays.fertility) {
    for (let y = 0; y < world.grid.height; y += 1) {
      for (let x = 0; x < world.grid.width; x += 1) {
        fertilityCells.push({
          position: { x, y },
          fertility: world.getFertility({ x, y }),
        });
      }
    }
  }

  return {
    fertilityCells,
    lines,
    memoryMarkers,
    focusMarker,
  };
}
