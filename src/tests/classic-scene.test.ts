import { describe, expect, it } from "vitest";
import { buildClassicScene } from "../render/classic/classicScene";
import { World } from "../sim/core/World";
import { IntelCreature } from "../sim/entities/IntelCreature";

const overlays = {
  debug: true,
  energy: false,
  fertility: false,
  intent: false,
  memory: false,
  relationships: false,
} as const;

describe("buildClassicScene", () => {
  it("uses the configured intel observation range for selected-cell highlights", () => {
    const world = new World({
      grid: { width: 5, height: 5 },
      intel: { observationRange: 2 },
      targetPlantPopulation: 0,
    });
    const creature = world.addCreature("intel", {
      facing: "east",
      position: { x: 1, y: 2 },
    });

    const scene = buildClassicScene(world, overlays, creature.id);

    expect(scene.cells.find((cell) => cell.key === "1,2")?.observedHighlighted).toBe(
      true,
    );
    expect(scene.cells.find((cell) => cell.key === "2,2")?.observedHighlighted).toBe(
      true,
    );
    expect(scene.cells.find((cell) => cell.key === "3,2")?.observedHighlighted).toBe(
      true,
    );
    expect(scene.cells.find((cell) => cell.key === "4,2")?.observedHighlighted).toBe(
      false,
    );
  });

  it("does not give simple creatures forward observation highlights", () => {
    const world = new World({
      grid: { width: 5, height: 5 },
      targetPlantPopulation: 0,
    });
    const creature = world.addCreature("simple", {
      facing: "east",
      position: { x: 1, y: 2 },
    });

    const scene = buildClassicScene(world, overlays, creature.id);

    expect(scene.cells.find((cell) => cell.key === "1,2")?.observedHighlighted).toBe(
      true,
    );
    expect(scene.cells.find((cell) => cell.key === "2,2")?.observedHighlighted).toBe(
      false,
    );
  });

  it("captures focused-cell memory, trail, and target metadata for inspector overlays", () => {
    const world = new World({
      grid: { width: 5, height: 5 },
      intel: { observationRange: 1 },
      targetPlantPopulation: 0,
    });
    const creature = world.addCreature("intel", {
      facing: "east",
      position: { x: 1, y: 2 },
    }) as IntelCreature;
    const linked = world.addCreature("intel", {
      position: { x: 4, y: 2 },
    }) as IntelCreature;
    const target = world.addPlant("red", { x: 2, y: 2 });
    creature.previousPosition = { x: 0, y: 2 };
    creature.partnerId = linked.id;
    creature.desiredPlantId = target.id;
    creature.plantMemory = [
      {
        plantId: "p-memory",
        type: "red",
        position: { x: 2, y: 2 },
        lastSeenTick: 2,
        confidence: 0.8,
      },
    ];
    creature.creatureMemory = [
      {
        creatureId: linked.id,
        kind: "intel",
        position: { x: 4, y: 2 },
        lastSeenTick: 4,
        confidence: 0.6,
      },
    ];
    world.tick = 7;

    const scene = buildClassicScene(
      world,
      {
        debug: true,
        energy: false,
        fertility: false,
        intent: true,
        memory: true,
        relationships: false,
      },
      creature.id,
      { x: 2, y: 2 },
    );

    expect(scene.cells.find((cell) => cell.key === "0,2")).toMatchObject({
      previousHighlighted: true,
    });
    expect(scene.cells.find((cell) => cell.key === "2,2")).toMatchObject({
      facingHighlighted: true,
      pinnedHighlighted: true,
      targetHighlighted: true,
      plantMemoryHighlighted: true,
      plantMemories: [
        {
          plantId: "p-memory",
          type: "red",
          confidence: 0.8,
          lastSeenTicksAgo: 5,
        },
      ],
      intentSources: [
        {
          creatureId: creature.id,
          selected: true,
        },
      ],
    });
    expect(scene.cells.find((cell) => cell.key === "4,2")).toMatchObject({
      linkedHighlighted: true,
      creatureMemoryHighlighted: true,
      creatureMemories: [
        {
          creatureId: linked.id,
          kind: "intel",
          confidence: 0.6,
          lastSeenTicksAgo: 3,
        },
      ],
    });
  });
});
