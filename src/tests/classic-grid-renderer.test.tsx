import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { FederatedPointerEvent } from "pixi.js";
import {
  CellInspector,
  drawGrid,
} from "../render/classic/ClassicGridRenderer";
import type { ClassicSceneCell } from "../render/classic/classicScene";

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
      creatureCount: 2,
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
        cell={cell}
        mode="selected"
        onClearCellSelection={vi.fn()}
        onSelectCreature={vi.fn()}
      />,
    );

    expect(markup).toContain("Selected cell 2,2");
    expect(markup).toContain("Flags selected, observed, plant memory");
    expect(markup).toContain("c1 simple 88");
    expect(markup).toContain("c2 intel 120");
    expect(markup).toContain("Select c1 simple 88e");
    expect(markup).toContain("Select c2 intel 120e");
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
      creatureCount: 0,
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
