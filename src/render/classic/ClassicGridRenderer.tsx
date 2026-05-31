import { useEffect, useRef, useState } from "react";
import { Application, Container, Graphics, Rectangle, Text, TextStyle } from "pixi.js";
import type { World } from "../../sim";
import type { Position } from "../../sim/entities/types";
import type { OverlaySettings } from "../../state/useSimulationController";
import { buildClassicScene, type ClassicSceneCell } from "./classicScene";

interface ClassicGridRendererProps {
  overlays: OverlaySettings;
  onSelectCell: (position: Position | null) => void;
  onSelectCreature: (id: string) => void;
  selectedCell: Position | null;
  selectedCreatureId: string | null;
  world: World;
}

const BACKGROUND_COLOR = 0xf8fafb;
const GRID_LINE_COLOR = 0xc9d2dc;
const MEMORY_CELL_COLOR = 0xeaf3ff;
const CREATURE_MEMORY_CELL_COLOR = 0xe7f8f2;
const DEBUG_TEXT_COLOR = 0x64748b;
const ENERGY_BADGE_TEXT_COLOR = 0x18212f;
const FERTILITY_HIGH_COLOR = 0xdaf2d9;
const FERTILITY_LOW_COLOR = 0xf3e6d8;
const INTENT_COLOR = 0xf97316;
const RELATIONSHIP_COLOR = 0x9b7a05;
const CREATURE_BORDER_COLOR = 0xffffff;
const SELECTED_OUTLINE_COLOR = 0x1f9d73;
const SELECTED_CELL_COLOR = 0x1f9d73;
const PINNED_CELL_COLOR = 0x0f766e;
const OBSERVED_CELL_COLOR = 0x3b82f6;
const TARGET_CELL_COLOR = 0xf59e0b;
const PREVIOUS_PATH_COLOR = 0x7c3aed;
const FACING_PATH_COLOR = 0x0f766e;
const LEADER_COLOR = 0x9b7a05;
const PARTNER_COLOR = 0xffe070;
const SIMPLE_COLOR = 0x2f6eea;
const INTEL_COLOR = 0xd64b36;
const ENERGY_LOW_COLOR = 0xff5a5a;
const ENERGY_STEADY_COLOR = 0xf2c14d;
const ENERGY_SURPLUS_COLOR = 0x46c27d;

const PLANT_COLORS = {
  green: 0x35b86b,
  red: 0xd84d4d,
  yellow: 0xf0cd4a,
  magenta: 0xd747b7,
} as const;

export function ClassicGridRenderer({
  overlays,
  onSelectCell,
  onSelectCreature,
  selectedCell,
  selectedCreatureId,
  world,
}: ClassicGridRendererProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const scene = buildClassicScene(world, overlays, selectedCreatureId, selectedCell);
  const sceneRef = useRef(scene);
  const debugRef = useRef(overlays.debug);
  const energyRef = useRef(overlays.energy);
  const fertilityRef = useRef(overlays.fertility);
  const selectCreatureRef = useRef(onSelectCreature);
  const selectCellRef = useRef(onSelectCell);
  const [hoveredCellKey, setHoveredCellKey] = useState<string | null>(null);

  sceneRef.current = scene;
  debugRef.current = overlays.debug;
  energyRef.current = overlays.energy;
  fertilityRef.current = overlays.fertility;
  selectCreatureRef.current = onSelectCreature;
  selectCellRef.current = onSelectCell;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    let cancelled = false;
    const app = new Application();

    void app
      .init({
        antialias: true,
        backgroundAlpha: 0,
        eventMode: "passive",
        resizeTo: host,
      })
      .then(() => {
        if (cancelled) {
          app.destroy(false, { children: true });
          return;
        }

        const canvas = app.canvas;
        canvasRef.current = canvas;
        host.appendChild(canvas);
        appRef.current = app;
        drawScene(
          app,
          sceneRef.current,
          debugRef.current,
          energyRef.current,
          fertilityRef.current,
          selectCellRef.current,
          selectCreatureRef.current,
          setHoveredCellKey,
          world.grid.width,
          world.grid.height,
        );

        const observer = new ResizeObserver(() => {
          if (appRef.current) {
            drawScene(
              appRef.current,
              sceneRef.current,
              debugRef.current,
              energyRef.current,
              fertilityRef.current,
              selectCellRef.current,
              selectCreatureRef.current,
              setHoveredCellKey,
              world.grid.width,
              world.grid.height,
            );
          }
        });
        observer.observe(host);
        resizeObserverRef.current = observer;
      });

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      const currentApp = appRef.current;
      const currentCanvas = canvasRef.current;
      appRef.current = null;
      canvasRef.current = null;
      if (currentApp) {
        if (currentCanvas?.parentElement === host) {
          host.removeChild(currentCanvas);
        }
        currentApp.destroy(false, { children: true });
      }
    };
  }, [onSelectCreature, world.grid.height, world.grid.width]);

  useEffect(() => {
    if (!appRef.current) {
      return;
    }

    drawScene(
      appRef.current,
      scene,
      overlays.debug,
      overlays.energy,
      overlays.fertility,
      onSelectCell,
      onSelectCreature,
      setHoveredCellKey,
      world.grid.width,
      world.grid.height,
    );
  }, [
    onSelectCell,
    onSelectCreature,
    overlays.debug,
    overlays.energy,
    overlays.fertility,
    scene,
    selectedCell,
    world.grid.height,
    world.grid.width,
  ]);

  const hoveredCell =
    scene.cells.find((cell) => cell.key === hoveredCellKey) ?? null;
  const pinnedCell =
    scene.cells.find((cell) => cell.pinnedHighlighted) ?? null;
  const selectedCreatureCell =
    scene.cells.find((cell) => cell.selectedHighlighted) ?? null;
  const inspectedCell = hoveredCell ?? pinnedCell ?? selectedCreatureCell;

  return (
    <div className="worldCanvas" aria-label="AgentWorld grid">
      <div className="pixiHost" ref={hostRef} />
      {inspectedCell ? (
        <CellInspector
          cell={inspectedCell}
          mode={hoveredCell ? "hovered" : inspectedCell.pinnedHighlighted ? "pinned" : "selected"}
          onClearCellSelection={inspectedCell.pinnedHighlighted ? () => onSelectCell(null) : undefined}
          onSelectCreature={onSelectCreature}
        />
      ) : null}
      {overlays.debug ? (
        <div className="debugLegend">
          <span className="legendSwatch selectedSwatch" />
          Selected
          <span className="legendSwatch pinnedSwatch" />
          Pinned
          <span className="legendSwatch trailSwatch" />
          Trail
          <span className="legendSwatch facingSwatch" />
          Facing
          <span className="legendSwatch observedSwatch" />
          Visible
          <span className="legendSwatch targetSwatch" />
          Target
        </div>
      ) : null}
      {overlays.energy ? (
        <div className="energyLegend">
          <span className="legendDot energyLowDot" />
          Hungry
          <span className="legendDot energySteadyDot" />
          Stable
          <span className="legendDot energySurplusDot" />
          Surplus
        </div>
      ) : null}
      {overlays.fertility ? (
        <div className="fertilityLegend">
          <span className="legendSwatch fertilityLowSwatch" />
          Low fertility
          <span className="legendSwatch fertilityHighSwatch" />
          High fertility
        </div>
      ) : null}
      {overlays.intent ? (
        <div className="intentLegend">
          <span className="legendSwatch intentSwatch" />
          Intel target
        </div>
      ) : null}
      {overlays.memory ? (
        <div className="memoryLegend">
          <span className="legendSwatch plantMemorySwatch" />
          Plant memory
          <span className="legendSwatch creatureMemorySwatch" />
          Creature memory
        </div>
      ) : null}
      {overlays.relationships ? (
        <div className="relationshipLegend">
          <span className="legendDot leaderDot" />
          Leader
          <span className="legendDot partnerDot" />
          Partner
        </div>
      ) : null}
    </div>
  );
}

function drawScene(
  app: Application,
  scene: ReturnType<typeof buildClassicScene>,
  showDebug: boolean,
  showEnergy: boolean,
  showFertility: boolean,
  onSelectCell: (position: Position | null) => void,
  onSelectCreature: (id: string) => void,
  onHoverCell: (key: string | null) => void,
  gridWidth: number,
  gridHeight: number,
) {
  const width = app.renderer.width;
  const height = app.renderer.height;
  const stage = app.stage;
  stage.removeChildren().forEach((child) => child.destroy());

  const layout = calculateLayout(width, height, gridWidth, gridHeight);
  const sceneRoot = new Container();
  sceneRoot.x = layout.offsetX;
  sceneRoot.y = layout.offsetY;

  sceneRoot.addChild(
    drawGrid(
      scene,
      layout,
      showDebug,
      showFertility,
      onHoverCell,
      onSelectCell,
    ),
  );
  if (showDebug && scene.focus) {
    sceneRoot.addChild(drawFocus(scene, layout));
  }
  if (scene.intents.length > 0) {
    sceneRoot.addChild(drawIntents(scene.intents, layout));
  }
  if (scene.relationships.length > 0) {
    sceneRoot.addChild(drawRelationships(scene.relationships, layout));
  }
  sceneRoot.addChild(
    drawCreatures(
      scene.creatures,
      layout,
      showDebug,
      showEnergy,
      onSelectCell,
      onSelectCreature,
      onHoverCell,
    ),
  );

  stage.addChild(sceneRoot);
}

// eslint-disable-next-line react-refresh/only-export-components
export function drawGrid(
  scene: ReturnType<typeof buildClassicScene>,
  layout: ReturnType<typeof calculateLayout>,
  showDebug: boolean,
  showFertility: boolean,
  onHoverCell: (key: string | null) => void,
  onSelectCell?: (position: Position | null) => void,
) {
  const container = new Container();
  const background = new Graphics()
    .roundRect(0, 0, layout.boardWidth, layout.boardHeight, 18)
    .fill(BACKGROUND_COLOR);
  container.addChild(background);

  for (const cell of scene.cells) {
    const x = cell.position.x * layout.cellSize;
    const y = cell.position.y * layout.cellSize;

    const tile = new Graphics();
    tile.rect(x, y, layout.cellSize, layout.cellSize);
    tile.fill(cellFillColor(cell, showFertility));
    tile.stroke({ color: GRID_LINE_COLOR, width: 1, alpha: 1 });
    tile.eventMode = "static";
    tile.cursor = "crosshair";
    tile.hitArea = new Rectangle(x, y, layout.cellSize, layout.cellSize);
    tile.label = cell.key;
    tile.on("pointerover", () => onHoverCell(cell.key));
    tile.on("pointerout", () => onHoverCell(null));
    tile.on("pointertap", () => onSelectCell?.(cell.position));
    container.addChild(tile);

    if (showDebug) {
      if (cell.pinnedHighlighted) {
        const pinnedOutline = new Graphics();
        pinnedOutline
          .rect(
            x + 10,
            y + 10,
            Math.max(0, layout.cellSize - 20),
            Math.max(0, layout.cellSize - 20),
          )
          .stroke({ color: PINNED_CELL_COLOR, width: 2, alpha: 0.92 });
        container.addChild(pinnedOutline);
      }

      if (cell.observedHighlighted) {
        const observedOutline = new Graphics();
        observedOutline
          .rect(
            x + 3,
            y + 3,
            Math.max(0, layout.cellSize - 6),
            Math.max(0, layout.cellSize - 6),
          )
          .stroke({ color: OBSERVED_CELL_COLOR, width: 2, alpha: 0.7 });
        container.addChild(observedOutline);
      }

      if (cell.selectedHighlighted) {
        const selectedOutline = new Graphics();
        selectedOutline
          .rect(
            x + 1.5,
            y + 1.5,
            Math.max(0, layout.cellSize - 3),
            Math.max(0, layout.cellSize - 3),
          )
          .stroke({ color: SELECTED_CELL_COLOR, width: 3, alpha: 0.95 });
        container.addChild(selectedOutline);
      }

      if (cell.previousHighlighted) {
        const previousOutline = new Graphics();
        previousOutline
          .rect(
            x + 14,
            y + 14,
            Math.max(0, layout.cellSize - 28),
            Math.max(0, layout.cellSize - 28),
          )
          .stroke({ color: PREVIOUS_PATH_COLOR, width: 2, alpha: 0.6 });
        container.addChild(previousOutline);
      }

      if (cell.facingHighlighted) {
        const facingOutline = new Graphics();
        facingOutline
          .rect(
            x + 18,
            y + 18,
            Math.max(0, layout.cellSize - 36),
            Math.max(0, layout.cellSize - 36),
          )
          .stroke({ color: FACING_PATH_COLOR, width: 2, alpha: 0.72 });
        container.addChild(facingOutline);
      }

      if (cell.targetHighlighted) {
        const targetOutline = new Graphics();
        targetOutline
          .rect(
            x + 6,
            y + 6,
            Math.max(0, layout.cellSize - 12),
            Math.max(0, layout.cellSize - 12),
          )
          .stroke({ color: TARGET_CELL_COLOR, width: 2, alpha: 0.95 });
        container.addChild(targetOutline);
      }

      if (cell.linkedHighlighted) {
        const linkedOutline = new Graphics();
        linkedOutline
          .rect(
            x + 22,
            y + 22,
            Math.max(0, layout.cellSize - 44),
            Math.max(0, layout.cellSize - 44),
          )
          .stroke({ color: RELATIONSHIP_COLOR, width: 2, alpha: 0.62 });
        container.addChild(linkedOutline);
      }

      const debugText = new Text({
        style: new TextStyle({
          fill: DEBUG_TEXT_COLOR,
          fontFamily: "monospace",
          fontSize: Math.max(10, layout.cellSize * 0.14),
          fontWeight: "700",
        }),
        text: cell.key,
      });
      debugText.x = x + layout.cellSize * 0.08;
      debugText.y = y + layout.cellSize * 0.08;
      container.addChild(debugText);

      const occupancyText = new Text({
        style: new TextStyle({
          fill: DEBUG_TEXT_COLOR,
          fontFamily: "monospace",
          fontSize: Math.max(9, layout.cellSize * 0.12),
          fontWeight: "700",
        }),
        text: `P${cell.plants.length} C${cell.creatureCount}`,
      });
      occupancyText.anchor.set(1, 1);
      occupancyText.x = x + layout.cellSize - layout.cellSize * 0.08;
      occupancyText.y = y + layout.cellSize - layout.cellSize * 0.08;
      container.addChild(occupancyText);
    }

    for (const [index, plant] of cell.plants.slice(0, 9).entries()) {
      const marker = new Graphics();
      const markerPosition = plantMarkerPosition(index, layout.cellSize);
      marker.circle(x + markerPosition.x, y + markerPosition.y, Math.max(4, layout.cellSize * 0.07));
      marker.fill(PLANT_COLORS[plant.type as keyof typeof PLANT_COLORS] ?? PLANT_COLORS.green);
      marker.stroke({ color: 0x000000, width: 1, alpha: 0.18 });
      marker.label = `${plant.type} ${plant.energy}`;
      container.addChild(marker);
    }

    if (cell.plants.length > 9) {
      const overflowText = new Text({
        style: new TextStyle({
          fill: 0x18212f,
          fontFamily: "monospace",
          fontSize: Math.max(11, layout.cellSize * 0.16),
          fontWeight: "800",
        }),
        text: `+${cell.plants.length - 9}`,
      });
      overflowText.anchor.set(1, 1);
      overflowText.x = x + layout.cellSize - layout.cellSize * 0.08;
      overflowText.y = y + layout.cellSize - layout.cellSize * 0.08;
      container.addChild(overflowText);
    }
  }

  return container;
}

function drawFocus(
  scene: ReturnType<typeof buildClassicScene>,
  layout: ReturnType<typeof calculateLayout>,
) {
  if (!scene.focus) {
    return new Container();
  }

  const graphics = new Graphics();
  const previous = cellCenter(scene.focus.previousPosition, layout);
  const current = cellCenter(scene.focus.position, layout);
  const facing = cellCenter(scene.focus.facingPosition, layout);

  graphics
    .moveTo(previous.x, previous.y)
    .lineTo(current.x, current.y)
    .stroke({ color: PREVIOUS_PATH_COLOR, alpha: 0.92, pixelLine: true, width: 3 });
  graphics
    .moveTo(current.x, current.y)
    .lineTo(facing.x, facing.y)
    .stroke({ color: FACING_PATH_COLOR, alpha: 0.92, pixelLine: true, width: 3 });

  if (scene.focus.targetPosition) {
    const target = cellCenter(scene.focus.targetPosition, layout);
    graphics
      .moveTo(current.x, current.y)
      .lineTo(target.x, target.y)
      .stroke({ color: TARGET_CELL_COLOR, alpha: 0.76, pixelLine: true, width: 2 });
  }

  if (scene.focus.linkedPosition) {
    const linked = cellCenter(scene.focus.linkedPosition, layout);
    graphics
      .moveTo(current.x, current.y)
      .lineTo(linked.x, linked.y)
      .stroke({ color: RELATIONSHIP_COLOR, alpha: 0.5, pixelLine: true, width: 2 });
  }

  return graphics;
}

function drawRelationships(
  relationships: ReturnType<typeof buildClassicScene>["relationships"],
  layout: ReturnType<typeof calculateLayout>,
) {
  const graphics = new Graphics();
  for (const relationship of relationships) {
    graphics
      .moveTo(
        relationship.from.x * layout.cellSize + layout.cellSize / 2,
        relationship.from.y * layout.cellSize + layout.cellSize / 2,
      )
      .lineTo(
        relationship.to.x * layout.cellSize + layout.cellSize / 2,
        relationship.to.y * layout.cellSize + layout.cellSize / 2,
      )
      .stroke({ color: RELATIONSHIP_COLOR, alpha: 0.72, pixelLine: true, width: 3 });
  }
  return graphics;
}

function drawIntents(
  intents: ReturnType<typeof buildClassicScene>["intents"],
  layout: ReturnType<typeof calculateLayout>,
) {
  const graphics = new Graphics();
  for (const intent of intents) {
    const from = cellCenter(intent.from, layout);
    const to = cellCenter(intent.to, layout);
    graphics
      .moveTo(from.x, from.y)
      .lineTo(to.x, to.y)
      .stroke({
        color: INTENT_COLOR,
        alpha: intent.selected ? 0.95 : 0.45,
        pixelLine: true,
        width: intent.selected ? 3 : 2,
      });
    graphics.circle(to.x, to.y, intent.selected ? 6 : 4).fill({
      color: INTENT_COLOR,
      alpha: intent.selected ? 0.9 : 0.55,
    });
  }
  return graphics;
}

function drawCreatures(
  creatures: ReturnType<typeof buildClassicScene>["creatures"],
  layout: ReturnType<typeof calculateLayout>,
  showDebug: boolean,
  showEnergy: boolean,
  onSelectCell: (position: Position | null) => void,
  onSelectCreature: (id: string) => void,
  onHoverCell: (key: string | null) => void,
) {
  const container = new Container();

  for (const creature of creatures) {
    const radius = Math.max(10, layout.cellSize * 0.15);
    const centerX = creature.position.x * layout.cellSize + layout.cellSize / 2;
    const centerY = creature.position.y * layout.cellSize + layout.cellSize / 2;
    const creatureGraphic = new Graphics();

    if (creature.selected) {
      creatureGraphic.circle(centerX, centerY, radius + 5).fill({
        color: SELECTED_OUTLINE_COLOR,
        alpha: 0.25,
      });
    }

    creatureGraphic.circle(centerX, centerY, radius).fill(creatureFillColor(creature.mode, creature.kind));
    creatureGraphic.stroke({ color: CREATURE_BORDER_COLOR, width: 3 });
    creatureGraphic.eventMode = "static";
    creatureGraphic.cursor = "pointer";
    creatureGraphic.hitArea = new Rectangle(centerX - radius, centerY - radius, radius * 2, radius * 2);
    creatureGraphic.label = `${creature.id} ${creature.kind} energy ${creature.energy}`;
    creatureGraphic.on("pointertap", () => {
      onSelectCell(creature.position);
      onSelectCreature(creature.id);
    });
    creatureGraphic.on("pointerover", () =>
      onHoverCell(`${creature.position.x},${creature.position.y}`),
    );
    creatureGraphic.on("pointerout", () => onHoverCell(null));
    container.addChild(creatureGraphic);

    if (showEnergy) {
      const ring = new Graphics();
      ring.circle(centerX, centerY, radius + 7).stroke({
        color: creatureEnergyColor(creature.energyState),
        width: creature.selected ? 4 : 3,
        alpha: creature.selected ? 0.95 : 0.75,
      });
      container.addChild(ring);

      const badge = new Graphics();
      const badgeWidth = Math.max(24, layout.cellSize * 0.32);
      const badgeHeight = Math.max(16, layout.cellSize * 0.18);
      badge
        .roundRect(
          centerX - badgeWidth / 2,
          centerY + radius + 4,
          badgeWidth,
          badgeHeight,
          6,
        )
        .fill({ color: 0xffffff, alpha: 0.94 })
        .stroke({
          color: creatureEnergyColor(creature.energyState),
          width: 2,
          alpha: 0.9,
        });
      container.addChild(badge);

      const energyText = new Text({
        style: new TextStyle({
          fill: ENERGY_BADGE_TEXT_COLOR,
          fontFamily: "monospace",
          fontSize: Math.max(9, layout.cellSize * 0.12),
          fontWeight: "800",
        }),
        text: String(creature.energy),
      });
      energyText.anchor.set(0.5);
      energyText.x = centerX;
      energyText.y = centerY + radius + 4 + badgeHeight / 2;
      container.addChild(energyText);
    }

    if (showDebug) {
      const label = new Text({
        style: new TextStyle({
          fill: creature.mode === "partnered" ? 0x4f3f00 : 0xffffff,
          fontFamily: "monospace",
          fontSize: Math.max(10, layout.cellSize * 0.16),
          fontWeight: "800",
        }),
        text: creature.debugLabel,
      });
      label.anchor.set(0.5);
      label.x = centerX;
      label.y = centerY;
      container.addChild(label);
    }
  }

  return container;
}

function creatureEnergyColor(state: "low" | "steady" | "surplus") {
  if (state === "low") {
    return ENERGY_LOW_COLOR;
  }
  if (state === "surplus") {
    return ENERGY_SURPLUS_COLOR;
  }
  return ENERGY_STEADY_COLOR;
}

export function CellInspector({
  cell,
  mode,
  onClearCellSelection,
  onSelectCreature,
}: {
  cell: ClassicSceneCell;
  mode: "hovered" | "pinned" | "selected";
  onClearCellSelection?: () => void;
  onSelectCreature: (id: string) => void;
}) {
  const tags = [
    cell.pinnedHighlighted ? "pinned" : null,
    cell.selectedHighlighted ? "selected" : null,
    cell.previousHighlighted ? "previous" : null,
    cell.facingHighlighted ? "ahead" : null,
    cell.linkedHighlighted ? "linked" : null,
    cell.observedHighlighted ? "observed" : null,
    cell.targetHighlighted ? "target" : null,
    cell.plantMemoryHighlighted ? "plant memory" : null,
    cell.creatureMemoryHighlighted ? "creature memory" : null,
  ].filter((tag): tag is string => tag !== null);

  return (
    <aside className="cellInspector" aria-label={`${mode} cell details`}>
      <h2>
        {mode === "hovered" ? "Hover cell" : mode === "pinned" ? "Pinned cell" : "Selected cell"}{" "}
        {cell.key}
      </h2>
      <p>
        Plants {cell.plants.length} | Creatures {cell.creatureCount} | Fertility{" "}
        {cell.fertility.toFixed(2)}
      </p>
      {mode === "pinned" && onClearCellSelection ? (
        <div className="cellInspectorActions">
          <button className="cellInspectorButton" onClick={onClearCellSelection} type="button">
            Clear pinned cell
          </button>
        </div>
      ) : null}
      {tags.length > 0 ? <p>Flags {tags.join(", ")}</p> : null}
      {cell.intentSources.length > 0 ? (
        <p>
          Intel targeters{" "}
          {cell.intentSources
            .map((intent) => `${intent.creatureId}${intent.selected ? " (selected)" : ""}`)
            .join(", ")}
        </p>
      ) : null}
      {cell.plantMemories.length > 0 ? (
        <p>
          Plant memory{" "}
          {cell.plantMemories
            .map(
              (entry) =>
                `${entry.plantId} ${entry.type} conf ${entry.confidence.toFixed(2)} seen ${entry.lastSeenTicksAgo}`,
            )
            .join(" | ")}
        </p>
      ) : null}
      {cell.creatureMemories.length > 0 ? (
        <p>
          Creature memory{" "}
          {cell.creatureMemories
            .map(
              (entry) =>
                `${entry.creatureId} ${entry.kind} conf ${entry.confidence.toFixed(2)} seen ${entry.lastSeenTicksAgo}`,
            )
            .join(" | ")}
        </p>
      ) : null}
      {cell.plants.length > 0 ? (
        <p>{cell.plants.map((plant) => `${plant.type}:${plant.energy}`).join(", ")}</p>
      ) : (
        <p>No plants</p>
      )}
      {cell.creatures.length > 0 ? (
        <p>
          {cell.creatures
            .map((creature) => `${creature.id} ${creature.kind} ${creature.energy}`)
            .join(", ")}
        </p>
      ) : (
        <p>No creatures</p>
      )}
      {cell.creatures.length > 0 ? (
        <div className="cellInspectorActions">
          {cell.creatures.map((creature) => (
            <button
              className={creature.selected ? "cellInspectorButton active" : "cellInspectorButton"}
              key={creature.id}
              onClick={() => onSelectCreature(creature.id)}
              type="button"
            >
              Select {creature.id} {creature.kind} {creature.energy}e
            </button>
          ))}
        </div>
      ) : null}
    </aside>
  );
}

function creatureFillColor(mode: string, kind: string) {
  if (mode === "leading") {
    return LEADER_COLOR;
  }
  if (mode === "partnered") {
    return PARTNER_COLOR;
  }
  return kind === "intel" ? INTEL_COLOR : SIMPLE_COLOR;
}

function plantMarkerPosition(index: number, cellSize: number): Position {
  const columns = 3;
  const spacing = cellSize * 0.22;
  const start = cellSize * 0.24;
  return {
    x: start + (index % columns) * spacing,
    y: start + Math.floor(index / columns) * spacing,
  };
}

function cellCenter(
  position: Position,
  layout: ReturnType<typeof calculateLayout>,
): Position {
  return {
    x: position.x * layout.cellSize + layout.cellSize / 2,
    y: position.y * layout.cellSize + layout.cellSize / 2,
  };
}

function cellFillColor(cell: ClassicSceneCell, showFertility: boolean): number {
  if (cell.plantMemoryHighlighted && cell.creatureMemoryHighlighted) {
    return interpolateColor(MEMORY_CELL_COLOR, CREATURE_MEMORY_CELL_COLOR, 0.5);
  }
  if (cell.creatureMemoryHighlighted) {
    return CREATURE_MEMORY_CELL_COLOR;
  }
  if (cell.memoryHighlighted) {
    return MEMORY_CELL_COLOR;
  }
  if (!showFertility) {
    return BACKGROUND_COLOR;
  }
  return interpolateColor(FERTILITY_LOW_COLOR, FERTILITY_HIGH_COLOR, cell.fertility);
}

function interpolateColor(start: number, end: number, amount: number): number {
  const clamped = Math.max(0, Math.min(1, amount));
  const startRed = (start >> 16) & 0xff;
  const startGreen = (start >> 8) & 0xff;
  const startBlue = start & 0xff;
  const endRed = (end >> 16) & 0xff;
  const endGreen = (end >> 8) & 0xff;
  const endBlue = end & 0xff;

  const red = Math.round(startRed + (endRed - startRed) * clamped);
  const green = Math.round(startGreen + (endGreen - startGreen) * clamped);
  const blue = Math.round(startBlue + (endBlue - startBlue) * clamped);

  return (red << 16) | (green << 8) | blue;
}

function calculateLayout(width: number, height: number, gridWidth: number, gridHeight: number) {
  const boardSize = Math.max(180, Math.min(width, height));
  const cellSize = boardSize / Math.max(gridWidth, gridHeight);
  const boardWidth = cellSize * gridWidth;
  const boardHeight = cellSize * gridHeight;

  return {
    boardHeight,
    boardWidth,
    cellSize,
    offsetX: (width - boardWidth) / 2,
    offsetY: (height - boardHeight) / 2,
  };
}
