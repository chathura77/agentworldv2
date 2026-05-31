import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FederatedPointerEvent } from "pixi.js";
import {
  CellInspector,
  drawGrid,
} from "../render/classic/ClassicGridRenderer";
import type { ClassicSceneCell } from "../render/classic/classicScene";

const cellActions = {
  onAddIntelAtCell: vi.fn(),
  onAddPlantAtCell: vi.fn(),
  onAddSimpleAtCell: vi.fn(),
  onClearCellCreatures: vi.fn(),
  onClearCellPlants: vi.fn(),
  onRemoveCreature: vi.fn(),
  onRemovePlant: vi.fn(),
  onSelectCell: vi.fn(),
  onSelectCreature: vi.fn(),
};

describe("CellInspector", () => {
  it("renders stacked creature selection controls for the inspected cell", () => {
    const cell: ClassicSceneCell = {
      key: "2,2",
      position: { x: 2, y: 2 },
      fertility: 0.85,
      memoryHighlighted: true,
      plantMemoryHighlighted: true,
      creatureMemoryHighlighted: false,
      pinnedHighlighted: false,
      selectedHighlighted: true,
      observedHighlighted: true,
      targetHighlighted: false,
      previousHighlighted: true,
      facingHighlighted: false,
      linkedHighlighted: true,
      creatureCount: 2,
      plantMemories: [
        {
          plantId: "p9",
          type: "red",
          confidence: 0.75,
          lastSeenTicksAgo: 5,
        },
      ],
      creatureMemories: [
        {
          creatureId: "c3",
          kind: "intel",
          confidence: 0.5,
          lastSeenTicksAgo: 2,
        },
      ],
      intentSources: [
        {
          creatureId: "c2",
          selected: false,
        },
      ],
      creatures: [
        {
          id: "c1",
          kind: "simple",
          energy: 88,
          mode: "wandering",
          selected: true,
        },
        {
          id: "c2",
          kind: "intel",
          energy: 120,
          mode: "observing",
          selected: false,
        },
      ],
      plants: [
        {
          id: "p1",
          type: "green",
          energy: 100,
        },
      ],
    };

    const markup = renderToStaticMarkup(
      <CellInspector
        cellActions={cellActions}
        cell={cell}
        mode="selected"
        onClearCellSelection={vi.fn()}
      />,
    );

    expect(markup).toContain("Selected cell 2,2");
    expect(markup).toContain("Pin cell");
    expect(markup).toContain("Flags selected, previous, linked, observed, plant memory");
    expect(markup).toContain("Intel targeters c2");
    expect(markup).toContain("Plant memory p9 red conf 0.75 seen 5");
    expect(markup).toContain("Creature memory c3 intel conf 0.50 seen 2");
    expect(markup).toContain("c1 simple 88");
    expect(markup).toContain("c2 intel 120");
    expect(markup).toContain("Add simple");
    expect(markup).toContain("Add intel");
    expect(markup).toContain("Clear creatures");
    expect(markup).toContain("Add green");
    expect(markup).toContain("Add magenta");
    expect(markup).toContain("Clear plants");
    expect(markup).toContain("Remove p1 green");
    expect(markup).toContain("Select c1 simple 88e");
    expect(markup).toContain("Select c2 intel 120e");
    expect(markup).toContain("Remove c1");
    expect(markup).toContain("Remove c2");
    expect(markup).toContain("green:100");
  });
});

describe("drawGrid", () => {
  it("forwards empty-cell clicks to the pinned-cell selector", () => {
    const cell: ClassicSceneCell = {
      key: "1,3",
      position: { x: 1, y: 3 },
      fertility: 0.4,
      memoryHighlighted: false,
      plantMemoryHighlighted: false,
      creatureMemoryHighlighted: false,
      pinnedHighlighted: false,
      selectedHighlighted: false,
      observedHighlighted: false,
      targetHighlighted: false,
      previousHighlighted: false,
      facingHighlighted: false,
      linkedHighlighted: false,
      creatureCount: 0,
      plantMemories: [],
      creatureMemories: [],
      intentSources: [],
      creatures: [],
      plants: [],
    };
    const onHoverCell = vi.fn();
    const onSelectCell = vi.fn();

    const container = drawGrid(
      {
        cells: [cell],
        creatures: [],
        focus: null,
        intents: [],
        relationships: [],
      },
      {
        boardHeight: 120,
        boardWidth: 120,
        cellSize: 120,
        offsetX: 0,
        offsetY: 0,
      },
      false,
      false,
      onHoverCell,
      onSelectCell,
    );

    const tile = container.children[1];
    tile.emit("pointertap", {} as FederatedPointerEvent);

    expect(onSelectCell).toHaveBeenCalledWith({ x: 1, y: 3 });
  });
});
