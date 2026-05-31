import { describe, expect, it } from "vitest";
import { buildAdvancedOverlayScene } from "../render/three/advancedScene";
import { World } from "../sim/core/World";
import { IntelCreature } from "../sim/entities/IntelCreature";

describe("buildAdvancedOverlayScene", () => {
  it("builds deterministic advanced overlay data from toggle state", () => {
    const world = new World({
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 4, height: 3 },
    });
    const leader = world.addCreature("intel", {
      facing: "east",
      position: { x: 1, y: 1 },
    }) as IntelCreature;
    leader.previousPosition = { x: 0, y: 1 };
    const partner = world.addCreature("intel", {
      position: { x: 3, y: 1 },
    }) as IntelCreature;
    leader.partnerId = partner.id;
    partner.leaderId = leader.id;
    const target = world.addPlant("red", { x: 2, y: 1 });
    leader.desiredPlantId = target.id;
    leader.plantMemory = [
      {
        plantId: "p-memory",
        type: "red",
        position: { x: 2, y: 1 },
        lastSeenTick: 1,
        confidence: 0.8,
      },
    ];
    leader.creatureMemory = [
      {
        creatureId: partner.id,
        kind: "intel",
        position: { x: 3, y: 1 },
        lastSeenTick: 2,
        confidence: 0.6,
      },
    ];

    const scene = buildAdvancedOverlayScene(
      world,
      {
        debug: true,
        energy: false,
        fertility: true,
        intent: true,
        memory: true,
        relationships: true,
      },
      leader.id,
    );

    expect(scene.fertilityCells).toHaveLength(12);
    expect(scene.focusMarker).toEqual({
      current: { x: 1, y: 1 },
      previous: { x: 0, y: 1 },
      facing: { x: 2, y: 1 },
    });
    expect(scene.memoryMarkers).toEqual([
      {
        key: "plant-p-memory",
        position: { x: 2, y: 1 },
        confidence: 0.8,
        kind: "plant",
      },
      {
        key: `creature-${partner.id}`,
        position: { x: 3, y: 1 },
        confidence: 0.6,
        kind: "creature",
      },
    ]);
    expect(scene.lines).toEqual(
      expect.arrayContaining([
        {
          key: `${leader.id}-${target.id}`,
          from: { x: 1, y: 1 },
          to: { x: 2, y: 1 },
          kind: "intent",
          selected: true,
        },
        {
          key: `${leader.id}-${partner.id}`,
          from: { x: 1, y: 1 },
          to: { x: 3, y: 1 },
          kind: "relationship",
          selected: true,
        },
        {
          key: `${leader.id}-previous`,
          from: { x: 0, y: 1 },
          to: { x: 1, y: 1 },
          kind: "previous",
          selected: true,
        },
        {
          key: `${leader.id}-facing`,
          from: { x: 1, y: 1 },
          to: { x: 2, y: 1 },
          kind: "facing",
          selected: true,
        },
        {
          key: `${leader.id}-target`,
          from: { x: 1, y: 1 },
          to: { x: 2, y: 1 },
          kind: "target",
          selected: true,
        },
        {
          key: `${leader.id}-linked`,
          from: { x: 1, y: 1 },
          to: { x: 3, y: 1 },
          kind: "linked",
          selected: true,
        },
      ]),
    );
  });

  it("suppresses advanced overlay data when toggles are off", () => {
    const world = new World({
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 3, height: 3 },
    });
    const creature = world.addCreature("intel", {
      facing: "north",
      position: { x: 1, y: 1 },
    }) as IntelCreature;
    const target = world.addPlant("green", { x: 1, y: 0 });
    creature.desiredPlantId = target.id;
    creature.plantMemory = [
      {
        plantId: target.id,
        type: "green",
        position: { x: 1, y: 0 },
        lastSeenTick: 0,
        confidence: 1,
      },
    ];

    const scene = buildAdvancedOverlayScene(
      world,
      {
        debug: false,
        energy: false,
        fertility: false,
        intent: false,
        memory: false,
        relationships: false,
      },
      creature.id,
    );

    expect(scene.fertilityCells).toEqual([]);
    expect(scene.lines).toEqual([]);
    expect(scene.memoryMarkers).toEqual([]);
    expect(scene.focusMarker).toBeNull();
  });
});
