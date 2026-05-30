import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ControlPanel } from "../components/ControlPanel";
import type {
  OverlaySettings,
  SimulationSettings,
} from "../state/useSimulationController";

const settings: SimulationSettings = {
  comboOneEnergy: 450,
  comboThreeEnergy: 400,
  comboTwoEnergy: 420,
  advancedFertilityRegrowthRate: 0.02,
  advancedMemoryDecayPerTick: 0.01,
  advancedGroupSizeLimit: 5,
  advancedSeasonalCycleLength: 120,
  advancedStrategyCooperation: 1,
  advancedStrategyEnergyReserve: 1,
  advancedStrategyExploitation: 1,
  advancedStrategyExploration: 1,
  advancedStrategyMemoryTrust: 1,
  advancedStrategyRiskAppetite: 1,
  advancedTerrainEnabled: true,
  communicationEnabled: true,
  enabledPlantTypes: 4,
  greenPlantEnergy: 100,
  gridSize: 5,
  hungerThreshold: 50,
  initialCreatureEnergy: 100,
  intelCreatures: 2,
  intelCreatureMemory: 20,
  intelMaxInventory: 4,
  intelMovementCost: 15,
  intelObservationRange: 1,
  intelPlantMemory: 20,
  partnershipMinComboEnergy: 400,
  intelStayCost: 10,
  magentaPlantEnergy: 90,
  plantSetMaxSize: 4,
  redPlantEnergy: 50,
  simpleCreatures: 2,
  yellowPlantEnergy: 70,
  simpleMaxInventory: 4,
  simpleMovementCost: 7,
  simpleStayCost: 5,
  simulationSpeed: 4,
  targetPlantPopulation: 25,
};

const overlays: OverlaySettings = {
  debug: true,
  energy: true,
  fertility: true,
  intent: true,
  memory: true,
  relationships: true,
};

describe("ControlPanel", () => {
  it("renders the expanded legacy config sections", () => {
    const markup = renderToStaticMarkup(
      <ControlPanel
        mode="classic"
        onAddIntelCreature={vi.fn()}
        onAddPlants={vi.fn()}
        onAddSimpleCreature={vi.fn()}
        onClearPlants={vi.fn()}
        onClearWorld={vi.fn()}
        onCaptureSnapshot={vi.fn(() => "{}")}
        onLoadSnapshot={vi.fn()}
        onReset={vi.fn()}
        onRestoreAdvancedDefaults={vi.fn()}
        onRestoreClassicDefaults={vi.fn()}
        onRestoreOverlayDefaults={vi.fn()}
        onSetRunning={vi.fn()}
        onStep={vi.fn()}
        onToggleMode={vi.fn()}
        onToggleOverlay={vi.fn()}
        onUpdateSetting={vi.fn()}
        overlays={overlays}
        running={false}
        settings={settings}
      />,
    );

    expect(markup).toContain("World");
    expect(markup).toContain("Creatures");
    expect(markup).toContain("Intel");
    expect(markup).toContain("Simple alive");
    expect(markup).toContain("Intel alive");
    expect(markup).toContain("Plant batch");
    expect(markup).toContain("Plant Energy");
    expect(markup).toContain("Combo Rewards");
    expect(markup).toContain("Advanced");
    expect(markup).toContain("Terrain fertility");
    expect(markup).toContain("Season length");
    expect(markup).toContain("Group size limit");
    expect(markup).toContain("Cooperation");
    expect(markup).toContain("Exploration");
    expect(markup).toContain("Exploitation");
    expect(markup).toContain("Risk appetite");
    expect(markup).toContain("Memory trust");
    expect(markup).toContain("Energy reserve");
    expect(markup).toContain("Snapshots");
    expect(markup).toContain("Hunger threshold");
    expect(markup).toContain("Communication");
    expect(markup).toContain("Partnership threshold");
    expect(markup).toContain("Magenta + yellow");
    expect(markup).toContain("Classic defaults");
    expect(markup).toContain("Advanced defaults");
    expect(markup).toContain("Overlay defaults");
    expect(markup).toContain("Classic focus");
    expect(markup).toContain("Capture, paste, and replay serialized worlds");
    expect(markup).toContain("Energy");
    expect(markup).toContain("Fertility");
    expect(markup).toContain("Intent");
    expect(markup).toContain("Capture");
    expect(markup).toContain("Load");
  });
});
