import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { EventLogPanel } from "../components/EventLogPanel";
import { summarizeWorldEvents, type SimulationEvent } from "../sim/inspection/eventLog";
import { World } from "../sim/core/World";
import { IntelCreature } from "../sim/entities/IntelCreature";

describe("simulation event log", () => {
  it("summarizes partnership and step changes from deterministic snapshots", () => {
    const world = new World({
      seed: "event-log",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
    });
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
    const target = world.addPlant("red", { x: 2, y: 1 });
    leader.partnerId = partner.id;
    leader.desiredPlantId = target.id;
    leader.desiredCombo = "green-red";
    partner.leaderId = leader.id;
    partner.requestedPlantId = target.id;

    const before = world.serialize();
    world.removePlant(target.id);
    world.step();
    const after = world.serialize();

    const summaries = summarizeWorldEvents("step", before, after);
    expect(summaries).toContain("Advanced 1 tick to 1.");
    expect(summaries).toContain("Ended 1 intel partnership.");
  });

  it("summarizes new communication messages from snapshot diffs", () => {
    const world = new World({
      seed: "event-log-messages",
      mode: "advanced",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
    });
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
    world.addPlant("red", { x: 2, y: 1 });
    world.addPlant("yellow", { x: 1, y: 1 });

    const before = world.serialize();
    world.step();
    const after = world.serialize();

    const summaries = summarizeWorldEvents("step", before, after);
    expect(summaries).toContain(
      `${leader.id} requested green-red partnership with ${partner.id} around p3.`,
    );
    expect(summaries).toContain(
      `${partner.id} accepted partnership with ${leader.id} in group-${leader.id}-${partner.id}.`,
    );
    expect(summaries).toContain(
      `${leader.id} formed group-${leader.id}-${partner.id} with ${partner.id} (2 members).`,
    );
    expect(summaries).toContain(
      `${leader.id} ended group-${leader.id}-${partner.id} with ${partner.id}.`,
    );
  });

  it("summarizes inspector edits even when counts do not change", () => {
    const world = new World({
      seed: "event-log-edit-world",
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
    });
    const creature = world.addCreature("simple", {
      position: { x: 1, y: 1 },
      energy: 100,
    });

    const before = world.serialize();
    world.setCreatureEnergy(creature.id, 125);
    const after = world.serialize();

    expect(summarizeWorldEvents("edit-world", before, after)).toContain(
      "Edited the current world state from the inspector.",
    );
  });

  it("renders recent events in the shell panel", () => {
    const events: SimulationEvent[] = [
      { id: "event-1", summary: "Spawned 1 intel creature.", tick: 0 },
      { id: "event-2", summary: "Advanced 1 tick to 1.", tick: 1 },
    ];

    const markup = renderToStaticMarkup(
      <EventLogPanel events={events} onClear={() => undefined} />,
    );

    expect(markup).toContain("Event log");
    expect(markup).toContain("2 recorded");
    expect(markup).toContain("Tick 1");
    expect(markup).toContain("Spawned 1 intel creature.");
    expect(markup).toContain("Advanced 1 tick to 1.");
    expect(markup.indexOf("Advanced 1 tick to 1.")).toBeLessThan(
      markup.indexOf("Spawned 1 intel creature."),
    );
  });
});
