import { describe, expect, it } from "vitest";
import { buildClassicScene } from "../render/classic/classicScene";
import { World } from "../sim/core/World";

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
});
