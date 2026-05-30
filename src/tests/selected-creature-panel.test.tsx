import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SelectedCreaturePanel } from "../components/SelectedCreaturePanel";
import { World } from "../sim/core/World";
import { IntelCreature } from "../sim/entities/IntelCreature";

describe("SelectedCreaturePanel", () => {
  it("renders rich intel creature state details", () => {
    const world = new World({
      mode: "advanced",
      hungerThreshold: 50,
      intel: { creatureMemory: 20, observationRange: 1, plantMemory: 20 },
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
      advanced: {
        groupSizeLimit: 3,
        strategy: {
          cooperation: 1.4,
          exploration: 0.8,
          exploitation: 1.6,
          riskAppetite: 0.9,
          memoryTrust: 1.2,
          energyReserve: 0.7,
        },
      },
    });
    const creature = world.addCreature("intel", {
      energy: 123,
      facing: "east",
      position: { x: 2, y: 3 },
    }) as IntelCreature;
    creature.previousPosition = { x: 1, y: 3 };
    const target = world.addPlant("red", { x: 3, y: 3 });
    const cellPlant = world.addPlant("yellow", { x: 2, y: 3 });
    const linked = world.addCreature("intel", { position: { x: 4, y: 3 }, energy: 99 }) as IntelCreature;
    creature.partnerId = linked.id;
    creature.groupMemberIds = [linked.id];
    creature.groupId = `group-${creature.id}-${linked.id}`;
    linked.leaderId = creature.id;
    linked.groupId = creature.groupId;
    creature.desiredPlantId = target.id;
    creature.desiredCombo = "green-red";
    creature.requestedPlantId = target.id;
    creature.inventory = [world.createDetachedPlant("green", { x: 2, y: 3 })];
    creature.plantMemory = [
      {
        confidence: 0.75,
        lastSeenTick: 10,
        plantId: target.id,
        position: { x: 3, y: 3 },
        type: "red",
      },
    ];
    creature.creatureMemory = [
      {
        confidence: 0.5,
        creatureId: linked.id,
        kind: "simple",
        lastSeenTick: 12,
        position: { x: 4, y: 3 },
      },
    ];
    world.communicationLog = [
      {
        id: "msg-1",
        tick: 14,
        fromCreatureId: creature.id,
        toCreatureId: linked.id,
        type: "requestPartnership",
        payload: {
          combo: "green-red",
          plantId: target.id,
        },
      },
      {
        id: "msg-2",
        tick: 15,
        fromCreatureId: linked.id,
        toCreatureId: creature.id,
        type: "acceptPartnership",
        payload: {
          combo: "green-red",
          plantId: target.id,
        },
      },
    ];

    const markup = renderToStaticMarkup(
      <SelectedCreaturePanel
        creature={creature}
        onAddIntelAtCell={() => undefined}
        onAddPlantAtCell={() => undefined}
        onAddSimpleAtCell={() => undefined}
        onSelectCell={() => undefined}
        onSelectCreature={() => undefined}
        selectedCell={{ x: 3, y: 3 }}
        tick={15}
        world={world}
      />,
    );

    expect(markup).toContain("Hunger");
    expect(markup).toContain("steady");
    expect(markup).toContain("Carry energy");
    expect(markup).toContain("100");
    expect(markup).toContain("Current cell plants: ");
    expect(markup).toContain(`${cellPlant.id}:yellow:${cellPlant.energy}`);
    expect(markup).toContain("Visible cells: 2, 3 -&gt; 3, 3");
    expect(markup).toContain("Pin current");
    expect(markup).toContain("Pin previous");
    expect(markup).toContain("Pin facing");
    expect(markup).toContain("Pin target");
    expect(markup).toContain("Pin linked");
    expect(markup).toContain("Target analysis");
    expect(markup).toContain("Target status: red visible now @ 3, 3");
    expect(markup).toContain("Best carried combo: none");
    expect(markup).toContain("Target combo path: green-red with red for 450");
    expect(markup).toContain("Visible cells");
    expect(markup).toContain(
      "2, 3 | current, plants, occupied | plants 1 | creatures 1 | fertility 1.00",
    );
    expect(markup).toContain("3, 3 | ahead, plants | plants 1 | creatures 0 | fertility 1.00");
    expect(markup).toContain(`Pursuit target: ${target.id} red @ 3, 3`);
    expect(markup).toContain("Desired combo: green-red");
    expect(markup).toContain(`Group: group-${creature.id}-${linked.id}`);
    expect(markup).toContain("Group size: 2 / 3");
    expect(markup).toContain(`Group members: ${linked.id} @ 4, 3`);
    expect(markup).toContain("Plant memory: 1 / 20");
    expect(markup).toContain("Creature memory: 1 / 20");
    expect(markup).toContain("Partnership threshold: 400");
    expect(markup).toContain(`Linked creature: ${linked.id} @ 4, 3`);
    expect(markup).toContain(
      "Strategy: coop 1.4 | explore 0.8 | exploit 1.6 | risk 0.9 | memory 1.2 | reserve 0.7",
    );
    expect(markup).toContain("Requested plant:");
    expect(markup).toContain("Role");
    expect(markup).toContain("leader");
    expect(markup).toContain("Communication");
    expect(markup).toContain(
      `t15 ${linked.id} -&gt; ${creature.id} acceptPartnership | combo green-red | plantId ${target.id}`,
    );
    expect(markup).toContain("Select linked");
    expect(markup).toContain("Pinned cell 3, 3");
    expect(markup).toContain("Flags visible, target, plant memory");
    expect(markup).toContain(`Creatures: none`);
    expect(markup).toContain("Add simple here");
    expect(markup).toContain("Add intel here");
    expect(markup).toContain("Green here");
    expect(markup).toContain("Magenta here");
    expect(markup).toContain("Creature roster");
    expect(markup).toContain(`${linked.id}</span><span>intel</span><span>4, 3</span><span>99e`);
    expect(markup).toContain("<button type=\"button\">Pin</button>");
    expect(markup).toContain("<button type=\"button\">Select</button>");
    expect(markup).toContain("red @ 3, 3 | seen 5 ticks ago | conf 0.75");
    expect(markup).toContain("simple @ 4, 3 | seen 3 ticks ago | conf 0.50");
  });

  it("renders the live creature roster when no creature is selected", () => {
    const world = new World({
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
    });
    const simple = world.addCreature("simple", {
      energy: 88,
      position: { x: 1, y: 2 },
    });

    const markup = renderToStaticMarkup(
      <SelectedCreaturePanel
        creature={null}
        onAddIntelAtCell={() => undefined}
        onAddPlantAtCell={() => undefined}
        onAddSimpleAtCell={() => undefined}
        onSelectCell={() => undefined}
        onSelectCreature={() => undefined}
        selectedCell={{ x: 1, y: 2 }}
        tick={0}
        world={world}
      />,
    );

    expect(markup).toContain("No creature selected");
    expect(markup).toContain("1 alive");
    expect(markup).toContain("Pinned cell 1, 2");
    expect(markup).toContain("Flags none");
    expect(markup).toContain(`Creatures: ${simple.id}:simple:88`);
    expect(markup).toContain("Red here");
    expect(markup).toContain("Creature roster");
    expect(markup).toContain(`${simple.id}</span><span>simple</span><span>1, 2</span><span>88e`);
  });
});
