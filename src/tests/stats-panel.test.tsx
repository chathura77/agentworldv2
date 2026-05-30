import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatsPanel } from "../components/StatsPanel";
import { World } from "../sim/core/World";
import { IntelCreature } from "../sim/entities/IntelCreature";

describe("StatsPanel", () => {
  it("renders population watchers and partnership count", () => {
    const world = new World({
      targetPlantPopulation: 0,
      grid: { width: 5, height: 5 },
    });

    world.addPlant("green", { x: 0, y: 0 });
    world.addPlant("green", { x: 1, y: 0 });
    world.addPlant("red", { x: 2, y: 0 });
    world.addPlant("yellow", { x: 3, y: 0 });
    world.addPlant("magenta", { x: 4, y: 0 });

    const leader = world.addCreature("intel", { position: { x: 1, y: 1 } }) as IntelCreature;
    const partner = world.addCreature("intel", { position: { x: 1, y: 1 } }) as IntelCreature;
    leader.partnerId = partner.id;
    partner.leaderId = leader.id;

    const markup = renderToStaticMarkup(
      <StatsPanel mode="classic" stats={world.getStats()} />,
    );

    expect(markup).toContain("Pairs");
    expect(markup).toContain(">1</dd>");
    expect(markup).toContain("Plant watchers");
    expect(markup).toContain("Green");
    expect(markup).toContain("Red");
    expect(markup).toContain("Yellow");
    expect(markup).toContain("Magenta");
    expect(markup).toContain("<strong>2</strong>");
    expect(markup).toContain("<strong>1</strong>");
  });
});
