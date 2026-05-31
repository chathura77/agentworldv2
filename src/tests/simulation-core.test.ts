import { describe, expect, it } from "vitest";
import { buildClassicScene } from "../render/classic/classicScene";
import { World } from "../sim/core/World";
import { IntelCreature } from "../sim/entities/IntelCreature";
import { SimpleCreature } from "../sim/entities/SimpleCreature";

function testWorld(seed = "test"): World {
  return new World({
    seed,
    targetPlantPopulation: 0,
    grid: { width: 5, height: 5 },
  });
}

describe("classic simulation core", () => {
  it("maintains the target plant population", () => {
    const world = new World({
      seed: "plants",
      targetPlantPopulation: 7,
      grid: { width: 5, height: 5 },
    });

    expect(world.plants).toHaveLength(7);

    world.removePlant(world.plants[0].id);
    world.removePlant(world.plants[0].id);
    world.removePlant(world.plants[0].id);
    expect(world.plants).toHaveLength(4);

    world.step();
    expect(world.plants).toHaveLength(7);
  });

  it("drains SimpleCreature energy differently for staying and moving", () => {
    const world = testWorld("energy");
    const creature = world.addCreature("simple", {
      position: { x: 2, y: 2 },
      energy: 100,
    });

    creature.setNextMove("stay");
    world.step();
    expect(creature.energy).toBe(95);

    creature.setNextMove("east");
    world.step();
    expect(creature.energy).toBe(88);
    expect(creature.position).toEqual({ x: 3, y: 2 });
  });

  it("lets a hungry SimpleCreature consume a same-cell plant", () => {
    const world = testWorld("hungry");
    const creature = world.addCreature("simple", {
      position: { x: 1, y: 1 },
      energy: 49,
    });
    world.addPlant("green", { x: 1, y: 1 });

    creature.setNextMove("stay");
    world.step();

    expect(creature.inventory).toHaveLength(0);
    expect(creature.energy).toBe(144);
    expect(world.plants).toHaveLength(0);
  });

  it("applies plant combination bonuses before individual eating", () => {
    const world = testWorld("combo");
    const creature = world.addCreature("simple", {
      position: { x: 1, y: 1 },
      energy: 49,
    });
    creature.receivePlant(world.createDetachedPlant("green"));
    creature.receivePlant(world.createDetachedPlant("red"));

    creature.setNextMove("stay");
    world.step();

    expect(creature.inventory).toHaveLength(0);
    expect(creature.energy).toBe(494);
  });

  it("uses configurable plant and combination energy values", () => {
    const world = new World({
      combinationEnergy: { "green-red": 300 },
      plantEnergy: { green: 111, red: 222 },
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
    });
    const spawned = world.addPlant("green", { x: 0, y: 0 });
    const creature = world.addCreature("simple", {
      position: { x: 1, y: 1 },
      energy: 49,
    });
    creature.receivePlant(world.createDetachedPlant("green"));
    creature.receivePlant(world.createDetachedPlant("red"));

    creature.setNextMove("stay");
    world.step();

    expect(spawned.energy).toBe(111);
    expect(creature.energy).toBe(344);
  });

  it("lets IntelCreature detect plants and creatures in current/ahead cells", () => {
    const world = testWorld("observe");
    const intel = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    });
    const simple = world.addCreature("simple", { position: { x: 1, y: 1 } });
    const plant = world.addPlant("yellow", { x: 2, y: 1 });

    intel.setNextMove("stay");
    simple.setNextMove("stay");
    world.step();

    expect(intel).toBeInstanceOf(IntelCreature);
    const intelCreature = intel as IntelCreature;
    expect(intelCreature.plantMemory.map((entry) => entry.plantId)).toContain(
      plant.id,
    );
    expect(
      intelCreature.creatureMemory.map((entry) => entry.creatureId),
    ).toContain(simple.id);
  });

  it("moves IntelCreature into and out of observation mode", () => {
    const world = testWorld("observation-mode");
    const intel = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    const first = world.addPlant("red", { x: 2, y: 1 });
    const second = world.addPlant("yellow", { x: 1, y: 1 });

    intel.setNextMove("stay");
    world.step();
    expect(intel.mode).toBe("pursuing");

    world.removePlant(first.id);
    world.removePlant(second.id);
    intel.inventory = [];
    intel.setNextMove("stay");
    world.step();

    expect(intel.mode).toBe("observing");
  });

  it("honors configurable hunger threshold and intel memory limits", () => {
    const world = new World({
      hungerThreshold: 30,
      intel: {
        creatureMemory: 1,
        plantMemory: 1,
      },
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
    });
    const intel = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
      energy: 29,
    }) as IntelCreature;
    const simple = world.addCreature("simple", { position: { x: 1, y: 1 } });
    intel.receivePlant(world.createDetachedPlant("green"));
    world.addPlant("red", { x: 1, y: 1 });
    world.addPlant("yellow", { x: 2, y: 1 });

    simple.setNextMove("stay");
    intel.setNextMove("stay");
    world.step();

    expect(intel.energy).toBeGreaterThan(29);
    expect(intel.plantMemory).toHaveLength(1);
    expect(intel.creatureMemory).toHaveLength(1);
  });

  it("creates and terminates IntelCreature partnerships", () => {
    const world = testWorld("partnership");
    const leader = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    const partner = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    leader.receivePlant(world.createDetachedPlant("green"));
    partner.receivePlant(world.createDetachedPlant("green"));
    const target = world.addPlant("red", { x: 2, y: 1 });
    world.addPlant("yellow", { x: 1, y: 1 });

    leader.setNextMove("stay");
    partner.setNextMove("stay");
    world.step();

    expect(leader.partnerId).toBe(partner.id);
    expect(partner.leaderId).toBe(leader.id);

    world.removePlant(target.id);
    leader.setNextMove("stay");
    partner.setNextMove("stay");
    world.step();

    expect(leader.partnerId).toBeNull();
    expect(partner.leaderId).toBeNull();
  });

  it("shares energy after cooperative partnership completion", () => {
    const world = testWorld("sharing");
    const leader = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
      energy: 100,
    }) as IntelCreature;
    const partner = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
      energy: 100,
    }) as IntelCreature;
    leader.receivePlant(world.createDetachedPlant("green"));
    partner.receivePlant(world.createDetachedPlant("green"));
    world.addPlant("red", { x: 2, y: 1 });
    world.addPlant("yellow", { x: 1, y: 1 });

    world.step();

    expect(leader.partnerId).toBeNull();
    expect(partner.leaderId).toBeNull();
    expect(leader.energy).toBeGreaterThan(950);
    expect(partner.energy).toBeGreaterThan(950);
  });

  it("records deterministic communication transcripts for shares and advanced partnerships", () => {
    const shareWorld = new World({
      seed: "share-messages",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
    });
    const sharerA = shareWorld.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    const sharerB = shareWorld.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    sharerA.receivePlant(shareWorld.createDetachedPlant("green"));
    sharerB.receivePlant(shareWorld.createDetachedPlant("red"));

    shareWorld.step();

    expect(shareWorld.getCommunicationMessages()).toEqual([
      expect.objectContaining({
        tick: 1,
        fromCreatureId: sharerA.id,
        toCreatureId: sharerB.id,
        type: "askInventory",
      }),
      expect.objectContaining({
        tick: 1,
        fromCreatureId: sharerA.id,
        toCreatureId: sharerB.id,
        type: "proposeShare",
        payload: expect.objectContaining({
          combo: "green-red",
          amount: 450,
        }),
      }),
      expect.objectContaining({
        tick: 1,
        fromCreatureId: sharerB.id,
        toCreatureId: sharerA.id,
        type: "acceptShare",
        payload: expect.objectContaining({
          combo: "green-red",
          amount: 900,
        }),
      }),
    ]);

    const partnershipWorld = new World({
      seed: "partnership-messages",
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
    });
    const leader = partnershipWorld.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    const partner = partnershipWorld.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    leader.receivePlant(partnershipWorld.createDetachedPlant("green"));
    partner.receivePlant(partnershipWorld.createDetachedPlant("green"));
    partnershipWorld.addPlant("red", { x: 2, y: 1 });
    partnershipWorld.addPlant("yellow", { x: 1, y: 1 });

    partnershipWorld.step();

    const messages = partnershipWorld.getCommunicationMessages();
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fromCreatureId: leader.id,
          toCreatureId: partner.id,
          type: "requestPartnership",
        }),
        expect.objectContaining({
          fromCreatureId: partner.id,
          toCreatureId: leader.id,
          type: "acceptPartnership",
        }),
        expect.objectContaining({
          fromCreatureId: leader.id,
          toCreatureId: partner.id,
          type: "joinGroup",
        }),
        expect.objectContaining({
          fromCreatureId: leader.id,
          toCreatureId: partner.id,
          type: "leaveGroup",
        }),
      ]),
    );

    const restored = World.deserialize(partnershipWorld.serialize());
    expect(restored.getCommunicationMessages()).toEqual(messages);
  });

  it("is deterministic with a fixed seed", () => {
    const left = new World({
      seed: "fixed-seed",
      targetPlantPopulation: 10,
      grid: { width: 5, height: 5 },
    });
    const right = new World({
      seed: "fixed-seed",
      targetPlantPopulation: 10,
      grid: { width: 5, height: 5 },
    });

    left.addCreature("simple", { position: { x: 0, y: 0 } });
    left.addCreature("intel", { position: { x: 2, y: 2 }, facing: "east" });
    right.addCreature("simple", { position: { x: 0, y: 0 } });
    right.addCreature("intel", { position: { x: 2, y: 2 }, facing: "east" });

    left.step(20);
    right.step(20);

    expect(left.serialize()).toEqual(right.serialize());
  });

  it("toggles Advanced Mode without resetting simulation state", () => {
    const world = testWorld("mode-toggle");
    const creature = world.addCreature("intel", {
      position: { x: 2, y: 2 },
      energy: 125,
    });
    const plant = world.addPlant("magenta", { x: 4, y: 4 });
    world.step(3);

    const tick = world.tick;
    const creatureIds = world.creatures.map((item) => item.id);
    const plantIds = world.plants.map((item) => item.id);

    world.setMode("advanced");

    expect(world.config.mode).toBe("advanced");
    expect(world.tick).toBe(tick);
    expect(world.creatures.map((item) => item.id)).toEqual(creatureIds);
    expect(world.plants.map((item) => item.id)).toEqual(plantIds);
    expect(world.getCreature(creature.id)).toBe(creature);
    expect(world.getPlant(plant.id)).toBe(plant);
  });

  it("uses deterministic advanced terrain fertility maps when enabled", () => {
    const world = new World({
      seed: "terrain",
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
      advanced: { terrainEnabled: true },
    });

    expect(world.getFertility({ x: 0, y: 0 })).not.toBe(1);
    expect(world.getFertility({ x: 2, y: 2 })).not.toBe(
      world.getFertility({ x: 0, y: 0 }),
    );
    expect(world.getStats().averageFertility).toBeGreaterThan(0.25);
  });

  it("applies advanced seasonal plant energy multipliers by tick", () => {
    const world = new World({
      seed: "season-energy",
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
      advanced: { seasonalCycleLength: 4 },
    });

    world.tick = 0;
    const springPlant = world.addPlant("green", { x: 0, y: 0 });
    world.tick = 3;
    const winterPlant = world.addPlant("green", { x: 1, y: 0 });

    expect(world.getSeasonState().name).toBe("winter");
    expect(springPlant.energy).toBe(105);
    expect(winterPlant.energy).toBe(90);
  });

  it("decays advanced creature memory confidence as well as plant memory", () => {
    const world = new World({
      seed: "memory-decay",
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
      advanced: { memoryDecayPerTick: 0.25 },
    });
    const intel = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "west",
    }) as IntelCreature;
    const other = world.addCreature("simple", { position: { x: 4, y: 4 } });
    const plant = world.addPlant("yellow", { x: 4, y: 4 });

    intel.plantMemory = [
      {
        confidence: 0.4,
        lastSeenTick: 0,
        plantId: plant.id,
        position: { x: 4, y: 4 },
        type: "yellow",
      },
    ];
    intel.creatureMemory = [
      {
        confidence: 0.4,
        creatureId: other.id,
        kind: "simple",
        lastSeenTick: 0,
        position: { x: 4, y: 4 },
      },
    ];

    intel.setNextMove("stay");
    world.step();

    expect(intel.plantMemory[0]?.confidence).toBeCloseTo(0.15, 5);
    expect(intel.creatureMemory[0]?.confidence).toBeCloseTo(0.15, 5);

    intel.setNextMove("stay");
    world.step();

    expect(intel.plantMemory).toHaveLength(0);
    expect(intel.creatureMemory).toHaveLength(0);
  });

  it("uses advanced utility scoring to prefer a nearer combo target", () => {
    const world = new World({
      seed: "advanced-utility",
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
    });
    const intel = world.addCreature("intel", {
      position: { x: 0, y: 1 },
      facing: "east",
      energy: 140,
    }) as IntelCreature;
    const farGreen = world.addPlant("green", { x: 4, y: 1 });
    const nearYellow = world.addPlant("yellow", { x: 1, y: 1 });

    intel.receivePlant(world.createDetachedPlant("red"));
    intel.mode = "pursuing";
    intel.plantMemory = [
      {
        confidence: 1,
        lastSeenTick: 0,
        plantId: farGreen.id,
        position: { x: 4, y: 1 },
        type: "green",
      },
      {
        confidence: 0.9,
        lastSeenTick: 0,
        plantId: nearYellow.id,
        position: { x: 1, y: 1 },
        type: "yellow",
      },
    ];

    intel.setNextMove("stay");
    world.step();

    expect(intel.desiredPlantId).toBe(nearYellow.id);
    expect(intel.desiredCombo).toBe("yellow-red");
  });

  it("lets advanced strategy weights bias intel toward exploration over combo exploitation", () => {
    const world = new World({
      seed: "advanced-strategy-exploration",
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
      advanced: {
        strategy: {
          exploration: 2,
          exploitation: 0.2,
        },
      },
    });
    const intel = world.addCreature("intel", {
      position: { x: 0, y: 1 },
      facing: "east",
      energy: 140,
    }) as IntelCreature;
    const farCombo = world.addPlant("green", { x: 4, y: 1 });
    const nearScout = world.addPlant("magenta", { x: 1, y: 1 });

    intel.receivePlant(world.createDetachedPlant("red"));
    intel.mode = "pursuing";
    intel.plantMemory = [
      {
        confidence: 1,
        lastSeenTick: 0,
        plantId: farCombo.id,
        position: { x: 4, y: 1 },
        type: "green",
      },
      {
        confidence: 1,
        lastSeenTick: 0,
        plantId: nearScout.id,
        position: { x: 1, y: 1 },
        type: "magenta",
      },
    ];

    intel.setNextMove("stay");
    world.step();

    expect(intel.desiredPlantId).toBe(nearScout.id);
    expect(intel.desiredCombo).toBeNull();
  });

  it("uses advanced cooperation weight to relax partnership thresholds only outside Classic Mode", () => {
    const classicWorld = new World({
      seed: "classic-cooperation-threshold",
      mode: "classic",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
      intel: { partnershipMinComboEnergy: 450 },
      advanced: { strategy: { cooperation: 2 } },
    });
    const classicLeader = classicWorld.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    const classicPartner = classicWorld.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    classicLeader.receivePlant(classicWorld.createDetachedPlant("yellow"));
    classicPartner.receivePlant(classicWorld.createDetachedPlant("yellow"));
    classicWorld.addPlant("red", { x: 2, y: 1 });
    classicWorld.addPlant("green", { x: 1, y: 1 });

    classicWorld.step();

    expect(classicLeader.partnerId).toBeNull();
    expect(classicPartner.leaderId).toBeNull();

    const advancedWorld = new World({
      seed: "advanced-cooperation-threshold",
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
      intel: { partnershipMinComboEnergy: 450 },
      advanced: { strategy: { cooperation: 2 } },
    });
    const advancedLeader = advancedWorld.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    const advancedPartner = advancedWorld.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    advancedLeader.receivePlant(advancedWorld.createDetachedPlant("yellow"));
    advancedPartner.receivePlant(advancedWorld.createDetachedPlant("yellow"));
    advancedWorld.addPlant("red", { x: 2, y: 1 });
    advancedWorld.addPlant("green", { x: 1, y: 1 });

    advancedWorld.step();

    expect(advancedLeader.partnerId).toBe(advancedPartner.id);
    expect(advancedPartner.leaderId).toBe(advancedLeader.id);
  });

  it("builds bounded advanced intel groups and clears them when the task completes", () => {
    const world = new World({
      seed: "advanced-groups",
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 6, height: 6 },
      advanced: { groupSizeLimit: 3 },
    });
    const leader = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
      energy: 120,
    }) as IntelCreature;
    const firstFollower = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
      energy: 120,
    }) as IntelCreature;
    const secondFollower = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
      energy: 120,
    }) as IntelCreature;
    const blockedFollower = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
      energy: 120,
    }) as IntelCreature;
    const target = world.addPlant("red", { x: 3, y: 1 });

    leader.receivePlant(world.createDetachedPlant("yellow"));
    firstFollower.receivePlant(world.createDetachedPlant("yellow"));
    secondFollower.receivePlant(world.createDetachedPlant("yellow"));
    blockedFollower.receivePlant(world.createDetachedPlant("yellow"));
    leader.mode = "pursuing";
    leader.desiredPlantId = target.id;
    leader.desiredCombo = "yellow-red";
    leader.plantMemory = [
      {
        confidence: 1,
        lastSeenTick: 0,
        plantId: target.id,
        position: { x: 3, y: 1 },
        type: "red",
      },
    ];

    world.step();

    expect(leader.groupMemberIds).toEqual([firstFollower.id, secondFollower.id]);
    expect(leader.partnerId).toBe(firstFollower.id);
    expect(firstFollower.leaderId).toBe(leader.id);
    expect(secondFollower.leaderId).toBe(leader.id);
    expect(blockedFollower.leaderId).toBeNull();
    expect(firstFollower.position).toEqual({ x: 1, y: 1 });
    expect(secondFollower.position).toEqual({ x: 1, y: 1 });
    expect(
      world
        .getCommunicationMessages()
        .filter(
          (message) =>
            message.type === "joinGroup" &&
            message.payload?.groupId === leader.groupId,
        )
        .map((message) => message.payload?.size),
    ).toEqual([2, 3]);

    world.step();

    expect(leader.groupMemberIds).toEqual([]);
    expect(leader.partnerId).toBeNull();
    expect(firstFollower.leaderId).toBeNull();
    expect(secondFollower.leaderId).toBeNull();
    expect(
      world.getCommunicationMessages().filter((message) => message.type === "leaveGroup"),
    ).toHaveLength(2);
  });

  it("uses advanced terrain-aware pathfinding to avoid low-fertility cells", () => {
    const world = new World({
      seed: "advanced-pathfinding",
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
      advanced: { terrainEnabled: true },
    });
    const intel = world.addCreature("intel", {
      position: { x: 0, y: 1 },
      facing: "east",
      energy: 140,
    }) as IntelCreature;
    const target = world.addPlant("green", { x: 2, y: 1 });

    intel.mode = "pursuing";
    intel.desiredPlantId = target.id;
    intel.plantMemory = [
      {
        confidence: 1,
        lastSeenTick: 0,
        plantId: target.id,
        position: { x: 2, y: 1 },
        type: "green",
      },
    ];

    const snapshot = world.serialize();
    snapshot.fertility = snapshot.fertility.map((row) => row.map(() => 1.5));
    snapshot.fertility[1][1] = 0.2;
    snapshot.fertility[2][1] = 0.2;

    const restored = World.deserialize(snapshot);
    const restoredIntel = restored.getCreature(intel.id) as IntelCreature;

    restored.step();

    expect(restoredIntel.position).toEqual({ x: 1, y: 0 });
  });

  it("serializes and restores deterministic world snapshots", () => {
    const world = new World({
      seed: "snapshot",
      targetPlantPopulation: 0,
      grid: { width: 6, height: 6 },
    });
    const intel = world.addCreature("intel", {
      position: { x: 2, y: 2 },
      facing: "north",
      energy: 140,
    }) as IntelCreature;
    intel.receivePlant(world.createDetachedPlant("magenta"));
    world.addPlant("yellow", { x: 4, y: 1 });
    world.step(5);

    const snapshot = world.serialize();
    const restored = World.deserialize(snapshot);

    expect(restored.serialize()).toEqual(snapshot);

    world.step(4);
    restored.step(4);

    expect(restored.serialize()).toEqual(world.serialize());
  });

  it("keeps a small world valid over many ticks", () => {
    const world = new World({
      seed: "integration",
      targetPlantPopulation: 8,
      grid: { width: 4, height: 4 },
    });
    world.addCreature("simple", { position: { x: 0, y: 0 } });
    world.addCreature("intel", { position: { x: 2, y: 2 }, facing: "west" });

    world.step(200);

    const plantIds = new Set<string>();
    for (const plant of world.plants) {
      expect(world.grid.contains(plant.position)).toBe(true);
      expect(plantIds.has(plant.id)).toBe(false);
      plantIds.add(plant.id);
    }

    for (const creature of world.creatures) {
      expect(world.grid.contains(creature.position)).toBe(true);
      expect(creature.inventory.length).toBeLessThanOrEqual(
        creature instanceof IntelCreature
          ? world.config.intel.maxInventory
          : world.config.simple.maxInventory,
      );
      if (creature.alive) {
        expect(creature.energy).toBeGreaterThan(0);
      }
      if (creature instanceof IntelCreature) {
        if (creature.partnerId) {
          expect(world.getCreature(creature.partnerId)).toBeInstanceOf(
            IntelCreature,
          );
        }
        if (creature.leaderId) {
          expect(world.getCreature(creature.leaderId)).toBeInstanceOf(
            IntelCreature,
          );
        }
      }
    }

    expect(world.plants).toHaveLength(8);
    expect(world.getStats().deadCreatures).toBeGreaterThanOrEqual(0);
  });

  it("uses domain classes for creature specializations", () => {
    const world = testWorld("classes");
    expect(world.addCreature("simple")).toBeInstanceOf(SimpleCreature);
    expect(world.addCreature("intel")).toBeInstanceOf(IntelCreature);
  });

  it("syncs exact alive creature populations for legacy shell controls", () => {
    const world = testWorld("population-sync");
    world.syncCreaturePopulation("simple", 3);
    world.syncCreaturePopulation("intel", 2);

    expect(world.getStats()).toMatchObject({
      aliveCreatures: 5,
      simpleCreatures: 3,
      intelCreatures: 2,
      deadCreatures: 0,
    });

    world.syncCreaturePopulation("simple", 1);
    world.syncCreaturePopulation("intel", 0);

    expect(world.getStats()).toMatchObject({
      aliveCreatures: 1,
      simpleCreatures: 1,
      intelCreatures: 0,
      deadCreatures: 4,
    });
  });

  it("removes inspector-edited creatures and clears linked intel relationships", () => {
    const world = testWorld("inspector-removal");
    const leader = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    const partner = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    leader.partnerId = partner.id;
    leader.groupMemberIds = [partner.id];
    leader.groupId = "group-c1-c2";
    leader.desiredPlantId = "p99";
    leader.desiredCombo = "green-red";
    partner.leaderId = leader.id;
    partner.groupId = leader.groupId;
    partner.requestedPlantId = "p99";

    expect(world.removeCreature(partner.id)?.id).toBe(partner.id);
    expect(world.getCreature(partner.id)).toBeNull();
    expect(leader.partnerId).toBeNull();
    expect(leader.groupMemberIds).toEqual([]);
    expect(leader.groupId).toBeNull();
    expect(leader.desiredPlantId).toBeNull();
    expect(leader.desiredCombo).toBeNull();
  });

  it("builds Classic renderer memory overlays from the selected intel creature", () => {
    const world = testWorld("classic-scene-memory");
    const intel = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    const simple = world.addCreature("simple", {
      position: { x: 3, y: 1 },
      energy: 120,
    });
    world.addPlant("green", { x: 2, y: 1 });
    intel.setNextMove("east");
    simple.setNextMove("stay");
    world.step();

    const withMemory = buildClassicScene(
      world,
      {
        debug: false,
        energy: false,
        fertility: false,
        intent: false,
        memory: true,
        relationships: false,
      },
      intel.id,
    );
    const withoutMemory = buildClassicScene(
      world,
      {
        debug: false,
        energy: false,
        fertility: false,
        intent: false,
        memory: false,
        relationships: false,
      },
      intel.id,
    );

    expect(withMemory.cells.find((cell) => cell.key === "2,1")?.memoryHighlighted).toBe(
      true,
    );
    expect(
      withMemory.cells.find((cell) => cell.key === "2,1")?.plantMemoryHighlighted,
    ).toBe(true);
    expect(
      withMemory.cells.find((cell) => cell.key === "3,1")?.creatureMemoryHighlighted,
    ).toBe(true);
    expect(withMemory.cells.find((cell) => cell.key === "3,1")?.memoryHighlighted).toBe(
      true,
    );
    expect(
      withoutMemory.cells.find((cell) => cell.key === "2,1")?.memoryHighlighted,
    ).toBe(false);
    expect(
      withoutMemory.cells.find((cell) => cell.key === "3,1")?.creatureMemoryHighlighted,
    ).toBe(false);
  });

  it("builds Classic debug overlays for selected intel vision and target cells", () => {
    const world = testWorld("classic-scene-debug");
    const intel = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    const target = world.addPlant("red", { x: 2, y: 1 });
    intel.plantMemory.push({
      plantId: target.id,
      type: target.type,
      position: { ...target.position },
      lastSeenTick: 0,
      confidence: 1,
    });
    intel.desiredPlantId = target.id;
    intel.desiredCombo = "green-red";
    intel.mode = "pursuing";

    const scene = buildClassicScene(
      world,
      {
        debug: true,
        energy: true,
        fertility: false,
        intent: true,
        memory: true,
        relationships: false,
      },
      intel.id,
    );

    expect(scene.cells.find((cell) => cell.key === "1,1")).toMatchObject({
      fertility: 1,
      selectedHighlighted: true,
      observedHighlighted: true,
      creatureCount: 1,
    });
    expect(scene.cells.find((cell) => cell.key === "2,1")).toMatchObject({
      observedHighlighted: true,
      targetHighlighted: true,
      memoryHighlighted: true,
    });
    expect(scene.focus).toMatchObject({
      creatureId: intel.id,
      position: { x: 1, y: 1 },
      previousPosition: { x: 1, y: 1 },
      facing: "east",
      facingPosition: { x: 2, y: 1 },
      targetPosition: { x: 2, y: 1 },
      energy: intel.energy,
      mode: "pursuing",
    });
    expect(scene.creatures).toContainEqual(
      expect.objectContaining({
        id: intel.id,
        energy: intel.energy,
        energyRatio: intel.energy / world.config.initialCreatureEnergy,
        energyState: "steady",
      }),
    );
    expect(scene.intents).toEqual([
      {
        key: `${intel.id}-${target.id}`,
        creatureId: intel.id,
        from: { x: 1, y: 1 },
        to: { x: 2, y: 1 },
        selected: true,
      },
    ]);
  });

  it("builds Classic renderer relationship overlays only for living partnerships", () => {
    const world = testWorld("classic-scene-links");
    const leader = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    const partner = world.addCreature("intel", {
      position: { x: 1, y: 1 },
      facing: "east",
    }) as IntelCreature;
    leader.partnerId = partner.id;
    partner.leaderId = leader.id;

    const linkedScene = buildClassicScene(
      world,
      {
        debug: false,
        energy: false,
        fertility: false,
        intent: false,
        memory: false,
        relationships: true,
      },
      null,
    );
    expect(linkedScene.relationships).toHaveLength(1);
    expect(linkedScene.focus).toBeNull();

    partner.kill();
    const clearedScene = buildClassicScene(
      world,
      {
        debug: false,
        energy: false,
        fertility: false,
        intent: false,
        memory: false,
        relationships: true,
      },
      null,
    );
    expect(clearedScene.relationships).toHaveLength(0);
  });

  it("captures per-cell plant and creature details for Classic inspection overlays", () => {
    const world = testWorld("classic-scene-inspector");
    const simple = world.addCreature("simple", {
      position: { x: 3, y: 2 },
      energy: 87,
    });
    world.addPlant("green", { x: 3, y: 2 });
    world.addPlant("red", { x: 3, y: 2 });

    const scene = buildClassicScene(
      world,
      {
        debug: true,
        energy: false,
        fertility: true,
        intent: false,
        memory: false,
        relationships: false,
      },
      simple.id,
    );
    const cell = scene.cells.find((item) => item.key === "3,2");

    expect(cell).toMatchObject({
      key: "3,2",
      creatureCount: 1,
      fertility: 1,
      creatureMemoryHighlighted: false,
      plantMemoryHighlighted: false,
      selectedHighlighted: true,
    });
    expect(cell?.plants.map((plant) => plant.type)).toEqual(["green", "red"]);
    expect(cell?.creatures).toEqual([
      {
        id: simple.id,
        kind: "simple",
        energy: 87,
        mode: "wandering",
        selected: true,
      },
    ]);
  });

  it("builds Classic intent overlays only when enabled and a target still exists", () => {
    const world = testWorld("classic-scene-intent-toggle");
    const intel = world.addCreature("intel", {
      position: { x: 0, y: 0 },
      facing: "east",
    }) as IntelCreature;
    const target = world.addPlant("green", { x: 1, y: 0 });
    intel.desiredPlantId = target.id;
    intel.desiredCombo = null;
    intel.mode = "pursuing";

    const withIntent = buildClassicScene(
      world,
      {
        debug: false,
        energy: false,
        fertility: false,
        intent: true,
        memory: false,
        relationships: false,
      },
      intel.id,
    );
    expect(withIntent.intents).toHaveLength(1);

    const withoutIntent = buildClassicScene(
      world,
      {
        debug: false,
        energy: false,
        fertility: false,
        intent: false,
        memory: false,
        relationships: false,
      },
      intel.id,
    );
    expect(withoutIntent.intents).toHaveLength(0);

    world.removePlant(target.id);
    const missingTarget = buildClassicScene(
      world,
      {
        debug: false,
        energy: false,
        fertility: false,
        intent: true,
        memory: false,
        relationships: false,
      },
      intel.id,
    );
    expect(missingTarget.intents).toHaveLength(0);
  });

  it("classifies Classic creature energy for overlay rendering", () => {
    const world = testWorld("classic-scene-energy");
    const hungry = world.addCreature("simple", {
      position: { x: 0, y: 0 },
      energy: 25,
    });
    const steady = world.addCreature("simple", {
      position: { x: 1, y: 0 },
      energy: 100,
    });
    const surplus = world.addCreature("intel", {
      position: { x: 2, y: 0 },
      energy: 165,
    });

    const scene = buildClassicScene(
      world,
      {
        debug: false,
        energy: true,
        fertility: false,
        intent: false,
        memory: false,
        relationships: false,
      },
      null,
    );

    expect(scene.creatures).toContainEqual(
      expect.objectContaining({
        id: hungry.id,
        energyState: "low",
        energyRatio: 0.25,
      }),
    );
    expect(scene.creatures).toContainEqual(
      expect.objectContaining({
        id: steady.id,
        energyState: "steady",
        energyRatio: 1,
      }),
    );
    expect(scene.creatures).toContainEqual(
      expect.objectContaining({
        id: surplus.id,
        energyState: "surplus",
        energyRatio: 1.65,
      }),
    );
  });
});
