import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  DEFAULT_CONFIG,
  World,
  type SerializedWorld,
  createSimulationConfig,
  type DeepPartial,
  type SimulationConfig,
} from "../sim";
import {
  createSimulationEvents,
  type SimulationAction,
  type SimulationEvent,
} from "../sim/inspection/eventLog";
import type { Creature } from "../sim/entities/Creature";
import type { PlantType, Position, SimulationMode } from "../sim/entities/types";

export interface SimulationSettings {
  gridSize: number;
  targetPlantPopulation: number;
  plantSetMaxSize: number;
  simpleCreatures: number;
  intelCreatures: number;
  enabledPlantTypes: number;
  hungerThreshold: number;
  initialCreatureEnergy: number;
  simpleMovementCost: number;
  simpleStayCost: number;
  simpleMaxInventory: number;
  intelMovementCost: number;
  intelStayCost: number;
  intelMaxInventory: number;
  intelPlantMemory: number;
  intelCreatureMemory: number;
  intelObservationRange: number;
  communicationEnabled: boolean;
  partnershipMinComboEnergy: number;
  greenPlantEnergy: number;
  redPlantEnergy: number;
  yellowPlantEnergy: number;
  magentaPlantEnergy: number;
  comboOneEnergy: number;
  comboTwoEnergy: number;
  comboThreeEnergy: number;
  advancedTerrainEnabled: boolean;
  advancedSeasonalCycleLength: number;
  advancedFertilityRegrowthRate: number;
  advancedMemoryDecayPerTick: number;
  advancedGroupSizeLimit: number;
  advancedStrategyCooperation: number;
  advancedStrategyExploration: number;
  advancedStrategyExploitation: number;
  advancedStrategyRiskAppetite: number;
  advancedStrategyMemoryTrust: number;
  advancedStrategyEnergyReserve: number;
  simulationSpeed: number;
}

export interface OverlaySettings {
  debug: boolean;
  energy: boolean;
  fertility: boolean;
  intent: boolean;
  memory: boolean;
  relationships: boolean;
}

export const DEFAULT_SIMULATION_SPEED = 4;

export const DEFAULT_SETTINGS: SimulationSettings = {
  gridSize: DEFAULT_CONFIG.grid.width,
  targetPlantPopulation: DEFAULT_CONFIG.targetPlantPopulation,
  plantSetMaxSize: DEFAULT_CONFIG.plantSetMaxSize,
  simpleCreatures: 2,
  intelCreatures: 2,
  enabledPlantTypes: DEFAULT_CONFIG.enabledPlantTypes,
  hungerThreshold: DEFAULT_CONFIG.hungerThreshold,
  initialCreatureEnergy: DEFAULT_CONFIG.initialCreatureEnergy,
  simpleMovementCost: DEFAULT_CONFIG.simple.movementCost,
  simpleStayCost: DEFAULT_CONFIG.simple.stayCost,
  simpleMaxInventory: DEFAULT_CONFIG.simple.maxInventory,
  intelMovementCost: DEFAULT_CONFIG.intel.movementCost,
  intelStayCost: DEFAULT_CONFIG.intel.stayCost,
  intelMaxInventory: DEFAULT_CONFIG.intel.maxInventory,
  intelPlantMemory: DEFAULT_CONFIG.intel.plantMemory,
  intelCreatureMemory: DEFAULT_CONFIG.intel.creatureMemory,
  intelObservationRange: DEFAULT_CONFIG.intel.observationRange,
  communicationEnabled: DEFAULT_CONFIG.intel.communicationEnabled,
  partnershipMinComboEnergy: DEFAULT_CONFIG.intel.partnershipMinComboEnergy,
  greenPlantEnergy: DEFAULT_CONFIG.plantEnergy.green,
  redPlantEnergy: DEFAULT_CONFIG.plantEnergy.red,
  yellowPlantEnergy: DEFAULT_CONFIG.plantEnergy.yellow,
  magentaPlantEnergy: DEFAULT_CONFIG.plantEnergy.magenta,
  comboOneEnergy: DEFAULT_CONFIG.combinationEnergy["green-red"],
  comboTwoEnergy: DEFAULT_CONFIG.combinationEnergy["yellow-red"],
  comboThreeEnergy: DEFAULT_CONFIG.combinationEnergy["magenta-yellow"],
  advancedTerrainEnabled: DEFAULT_CONFIG.advanced.terrainEnabled,
  advancedSeasonalCycleLength: DEFAULT_CONFIG.advanced.seasonalCycleLength,
  advancedFertilityRegrowthRate: DEFAULT_CONFIG.advanced.fertilityRegrowthRate,
  advancedMemoryDecayPerTick: DEFAULT_CONFIG.advanced.memoryDecayPerTick,
  advancedGroupSizeLimit: DEFAULT_CONFIG.advanced.groupSizeLimit,
  advancedStrategyCooperation: DEFAULT_CONFIG.advanced.strategy.cooperation,
  advancedStrategyExploration: DEFAULT_CONFIG.advanced.strategy.exploration,
  advancedStrategyExploitation: DEFAULT_CONFIG.advanced.strategy.exploitation,
  advancedStrategyRiskAppetite: DEFAULT_CONFIG.advanced.strategy.riskAppetite,
  advancedStrategyMemoryTrust: DEFAULT_CONFIG.advanced.strategy.memoryTrust,
  advancedStrategyEnergyReserve: DEFAULT_CONFIG.advanced.strategy.energyReserve,
  simulationSpeed: DEFAULT_SIMULATION_SPEED,
};

export const DEFAULT_OVERLAYS: OverlaySettings = {
  debug: false,
  energy: false,
  fertility: false,
  intent: true,
  memory: true,
  relationships: true,
};

const seed = "agentworld-ui";

function createInitialWorld() {
  const world = new World(createConfig(DEFAULT_SETTINGS));
  world.syncCreaturePopulation("simple", DEFAULT_SETTINGS.simpleCreatures);
  world.syncCreaturePopulation("intel", DEFAULT_SETTINGS.intelCreatures);
  return world;
}

export function useSimulationController() {
  const [settings, setSettings] = useState<SimulationSettings>(() =>
    settingsFromWorld(createInitialWorld(), DEFAULT_SETTINGS.simulationSpeed),
  );
  const [overlays, setOverlays] = useState<OverlaySettings>(DEFAULT_OVERLAYS);
  const [running, setRunning] = useState(false);
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<Position | null>(null);
  const [recentEvents, setRecentEvents] = useState<SimulationEvent[]>([]);
  const [, setVersion] = useState(0);
  const worldRef = useRef(createInitialWorld());
  const nextEventIdRef = useRef(1);
  const world = worldRef.current;
  const syncPopulationSettings = useEffectEvent(
    (currentWorld: World, simulationSpeed = settings.simulationSpeed) => {
      const stats = currentWorld.getStats();
      setSettings((current) => ({
        ...current,
        simpleCreatures: stats.simpleCreatures,
        intelCreatures: stats.intelCreatures,
        simulationSpeed,
      }));
    },
  );

  useEffect(() => {
    if (!running) {
      return;
    }

    const intervalMs = Math.max(33, 1000 / settings.simulationSpeed);
    const interval = window.setInterval(() => {
      worldRef.current.step();
      syncPopulationSettings(worldRef.current);
      if (selectedCreatureId && !worldRef.current.getCreature(selectedCreatureId)) {
        setSelectedCreatureId(null);
      }
      setVersion((current) => current + 1);
    }, intervalMs);

    return () => window.clearInterval(interval);
  }, [running, selectedCreatureId, settings.simulationSpeed, syncPopulationSettings]);

  const selectedCreature = world.getCreature(selectedCreatureId);

  function appendEvents(action: SimulationAction, before: SerializedWorld, after: SerializedWorld) {
    const next = createSimulationEvents(action, before, after, nextEventIdRef.current);
    nextEventIdRef.current = next.nextId;
    if (next.events.length === 0) {
      return;
    }
    setRecentEvents((current) => [...current, ...next.events].slice(-30));
  }

  function mutate(actionType: SimulationAction, action: (currentWorld: World) => void) {
    const before = worldRef.current.serialize();
    action(worldRef.current);
    appendEvents(actionType, before, worldRef.current.serialize());
    syncPopulationSettings(worldRef.current);
    const selected = worldRef.current.getCreature(selectedCreatureId);
    if (selectedCreatureId && !selected) {
      setSelectedCreatureId(null);
    }
    setVersion((current) => current + 1);
  }

  function reset(nextSettings = settings) {
    const before = worldRef.current.serialize();
    const mode = worldRef.current.config.mode;
    worldRef.current = new World(createConfig(nextSettings, mode));
    worldRef.current.syncCreaturePopulation("simple", nextSettings.simpleCreatures);
    worldRef.current.syncCreaturePopulation("intel", nextSettings.intelCreatures);
    appendEvents("reset", before, worldRef.current.serialize());
    syncPopulationSettings(worldRef.current, nextSettings.simulationSpeed);
    setSelectedCreatureId(null);
    setSelectedCell(null);
    setVersion((current) => current + 1);
  }

  function updateSetting<K extends keyof SimulationSettings>(
    key: K,
    value: SimulationSettings[K],
  ) {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);

    if (key === "gridSize") {
      reset(nextSettings);
      return;
    }

    if (key === "simpleCreatures" || key === "intelCreatures") {
      mutate("update-settings", (currentWorld) => {
        currentWorld.syncCreaturePopulation(
          key === "simpleCreatures" ? "simple" : "intel",
          Number(value),
        );
      });
      return;
    }

    mutate("update-settings", (currentWorld) => {
      currentWorld.setConfig(
        createSimulationConfig({
          ...currentWorld.config,
          ...createConfig(nextSettings, currentWorld.config.mode),
        }),
      );
      currentWorld.step(0);
    });
  }

  function toggleOverlay(key: keyof OverlaySettings) {
    setOverlays((current) => ({ ...current, [key]: !current[key] }));
  }

  function restoreClassicDefaults() {
    const nextSettings: SimulationSettings = {
      ...settings,
      gridSize: DEFAULT_SETTINGS.gridSize,
      targetPlantPopulation: DEFAULT_SETTINGS.targetPlantPopulation,
      plantSetMaxSize: DEFAULT_SETTINGS.plantSetMaxSize,
      simpleCreatures: DEFAULT_SETTINGS.simpleCreatures,
      intelCreatures: DEFAULT_SETTINGS.intelCreatures,
      enabledPlantTypes: DEFAULT_SETTINGS.enabledPlantTypes,
      hungerThreshold: DEFAULT_SETTINGS.hungerThreshold,
      initialCreatureEnergy: DEFAULT_SETTINGS.initialCreatureEnergy,
      simpleMovementCost: DEFAULT_SETTINGS.simpleMovementCost,
      simpleStayCost: DEFAULT_SETTINGS.simpleStayCost,
      simpleMaxInventory: DEFAULT_SETTINGS.simpleMaxInventory,
      intelMovementCost: DEFAULT_SETTINGS.intelMovementCost,
      intelStayCost: DEFAULT_SETTINGS.intelStayCost,
      intelMaxInventory: DEFAULT_SETTINGS.intelMaxInventory,
      intelPlantMemory: DEFAULT_SETTINGS.intelPlantMemory,
      intelCreatureMemory: DEFAULT_SETTINGS.intelCreatureMemory,
      intelObservationRange: DEFAULT_SETTINGS.intelObservationRange,
      communicationEnabled: DEFAULT_SETTINGS.communicationEnabled,
      partnershipMinComboEnergy: DEFAULT_SETTINGS.partnershipMinComboEnergy,
      greenPlantEnergy: DEFAULT_SETTINGS.greenPlantEnergy,
      redPlantEnergy: DEFAULT_SETTINGS.redPlantEnergy,
      yellowPlantEnergy: DEFAULT_SETTINGS.yellowPlantEnergy,
      magentaPlantEnergy: DEFAULT_SETTINGS.magentaPlantEnergy,
      comboOneEnergy: DEFAULT_SETTINGS.comboOneEnergy,
      comboTwoEnergy: DEFAULT_SETTINGS.comboTwoEnergy,
      comboThreeEnergy: DEFAULT_SETTINGS.comboThreeEnergy,
      simulationSpeed: DEFAULT_SETTINGS.simulationSpeed,
    };
    setSettings(nextSettings);
    reset(nextSettings);
  }

  function restoreAdvancedDefaults() {
    const nextSettings: SimulationSettings = {
      ...settings,
      advancedTerrainEnabled: DEFAULT_SETTINGS.advancedTerrainEnabled,
      advancedSeasonalCycleLength: DEFAULT_SETTINGS.advancedSeasonalCycleLength,
      advancedFertilityRegrowthRate: DEFAULT_SETTINGS.advancedFertilityRegrowthRate,
      advancedMemoryDecayPerTick: DEFAULT_SETTINGS.advancedMemoryDecayPerTick,
      advancedGroupSizeLimit: DEFAULT_SETTINGS.advancedGroupSizeLimit,
      advancedStrategyCooperation: DEFAULT_SETTINGS.advancedStrategyCooperation,
      advancedStrategyExploration: DEFAULT_SETTINGS.advancedStrategyExploration,
      advancedStrategyExploitation: DEFAULT_SETTINGS.advancedStrategyExploitation,
      advancedStrategyRiskAppetite: DEFAULT_SETTINGS.advancedStrategyRiskAppetite,
      advancedStrategyMemoryTrust: DEFAULT_SETTINGS.advancedStrategyMemoryTrust,
      advancedStrategyEnergyReserve: DEFAULT_SETTINGS.advancedStrategyEnergyReserve,
    };
    setSettings(nextSettings);
    mutate("update-settings", (currentWorld) => {
      currentWorld.setConfig(
        createSimulationConfig({
          ...currentWorld.config,
          ...createConfig(nextSettings, currentWorld.config.mode),
        }),
      );
      currentWorld.step(0);
    });
  }

  function restoreOverlayDefaults() {
    setOverlays(DEFAULT_OVERLAYS);
  }

  function toggleMode() {
    mutate("toggle-mode", (currentWorld) => {
      currentWorld.setMode(
        currentWorld.config.mode === "classic" ? "advanced" : "classic",
      );
    });
  }

  function stepOnce() {
    mutate("step", (currentWorld) => currentWorld.step());
  }

  function addPlants(count = 4) {
    mutate("add-plants", (currentWorld) => {
      for (let i = 0; i < count; i += 1) {
        currentWorld.addPlant();
      }
    });
  }

  function addCreature(kind: "simple" | "intel", position?: Position) {
    mutate(kind === "simple" ? "add-simple-creature" : "add-intel-creature", (currentWorld) => {
      const creature = currentWorld.addCreature(kind, { position });
      setSelectedCreatureId(creature.id);
      setSelectedCell(creature.position);
    });
  }

  function addPlantAtCell(type: PlantType, position: Position) {
    mutate("add-plants", (currentWorld) => {
      currentWorld.addPlant(type, position);
      setSelectedCell(position);
    });
  }

  function removePlant(id: string) {
    mutate("edit-world", (currentWorld) => {
      currentWorld.removePlant(id);
    });
  }

  function clearCellPlants(position: Position) {
    mutate("edit-world", (currentWorld) => {
      currentWorld.removePlantsAt(position);
      setSelectedCell(position);
    });
  }

  function removeCreature(id: string) {
    mutate("edit-world", (currentWorld) => {
      const removed = currentWorld.removeCreature(id);
      if (removed && selectedCell && selectedCell.x === removed.position.x && selectedCell.y === removed.position.y) {
        setSelectedCell(removed.position);
      }
      if (selectedCreatureId === id) {
        setSelectedCreatureId(null);
      }
    });
  }

  function clearCellCreatures(position: Position) {
    mutate("edit-world", (currentWorld) => {
      const removed = currentWorld.removeCreaturesAt(position);
      if (removed.some((creature) => creature.id === selectedCreatureId)) {
        setSelectedCreatureId(null);
      }
      setSelectedCell(position);
    });
  }

  function adjustCreatureEnergy(id: string, delta: number) {
    mutate("edit-world", (currentWorld) => {
      const creature = currentWorld.getCreature(id);
      if (!creature) {
        return;
      }
      currentWorld.setCreatureEnergy(id, creature.energy + delta);
      if (!currentWorld.getCreature(id)?.alive && selectedCreatureId === id) {
        setSelectedCreatureId(null);
      }
    });
  }

  function clearWorld() {
    mutate("clear-world", (currentWorld) => {
      currentWorld.clearWorld();
      setSelectedCreatureId(null);
      setSelectedCell(null);
    });
  }

  function clearPlants() {
    mutate("clear-plants", (currentWorld) => currentWorld.clearPlants());
  }

  function captureSnapshot() {
    return JSON.stringify(worldRef.current.serialize(), null, 2);
  }

  function loadSnapshot(snapshotText: string) {
    const before = worldRef.current.serialize();
    const parsed = JSON.parse(snapshotText) as SerializedWorld;
    const nextWorld = World.deserialize(parsed);
    worldRef.current = nextWorld;
    appendEvents("load-snapshot", before, nextWorld.serialize());
    setSettings((current) => settingsFromWorld(nextWorld, current.simulationSpeed));
    const selected = nextWorld.getCreature(selectedCreatureId);
    if (selectedCreatureId && !selected) {
      setSelectedCreatureId(null);
    }
    if (
      selectedCell &&
      (selectedCell.x >= nextWorld.grid.width || selectedCell.y >= nextWorld.grid.height)
    ) {
      setSelectedCell(null);
    }
    setVersion((current) => current + 1);
  }

  function clearEventLog() {
    setRecentEvents([]);
  }

  function selectCreature(id: string | null) {
    setSelectedCreatureId(id);
    if (!id) {
      return;
    }
    const creature = worldRef.current.getCreature(id);
    if (creature) {
      setSelectedCell(creature.position);
    }
  }

  return {
    world,
    stats: world.getStats(),
    recentEvents,
    running,
    selectedCreature: selectedCreature as Creature | null,
    selectedCreatureId,
    selectedCell,
    settings,
    overlays,
    actions: {
      addCreature,
      addPlantAtCell,
      addPlants,
      adjustCreatureEnergy,
      clearPlants,
      clearCellCreatures,
      clearCellPlants,
      clearWorld,
      captureSnapshot,
      clearEventLog,
      loadSnapshot,
      removeCreature,
      removePlant,
      reset,
      selectCell: setSelectedCell,
      selectCreature,
      setRunning,
      stepOnce,
      toggleMode,
      toggleOverlay,
      restoreAdvancedDefaults,
      restoreClassicDefaults,
      restoreOverlayDefaults,
      updateSetting,
    },
  };
}

function createConfig(
  settings: SimulationSettings,
  mode: SimulationMode = "classic",
): DeepPartial<SimulationConfig> {
  return {
    seed,
    mode,
    grid: {
      width: settings.gridSize,
      height: settings.gridSize,
      legacyCellPixels: 100,
    },
    targetPlantPopulation: settings.targetPlantPopulation,
    plantSetMaxSize: settings.plantSetMaxSize,
    enabledPlantTypes: settings.enabledPlantTypes,
    hungerThreshold: settings.hungerThreshold,
    initialCreatureEnergy: settings.initialCreatureEnergy,
    plantEnergy: {
      green: settings.greenPlantEnergy,
      red: settings.redPlantEnergy,
      yellow: settings.yellowPlantEnergy,
      magenta: settings.magentaPlantEnergy,
    },
    combinationEnergy: {
      "green-red": settings.comboOneEnergy,
      "yellow-red": settings.comboTwoEnergy,
      "magenta-yellow": settings.comboThreeEnergy,
    },
    advanced: {
      terrainEnabled: settings.advancedTerrainEnabled,
      seasonalCycleLength: settings.advancedSeasonalCycleLength,
      fertilityRegrowthRate: settings.advancedFertilityRegrowthRate,
      memoryDecayPerTick: settings.advancedMemoryDecayPerTick,
      groupSizeLimit: settings.advancedGroupSizeLimit,
      strategy: {
        cooperation: settings.advancedStrategyCooperation,
        exploration: settings.advancedStrategyExploration,
        exploitation: settings.advancedStrategyExploitation,
        riskAppetite: settings.advancedStrategyRiskAppetite,
        memoryTrust: settings.advancedStrategyMemoryTrust,
        energyReserve: settings.advancedStrategyEnergyReserve,
      },
    },
    simple: {
      movementCost: settings.simpleMovementCost,
      stayCost: settings.simpleStayCost,
      maxInventory: settings.simpleMaxInventory,
    },
    intel: {
      movementCost: settings.intelMovementCost,
      stayCost: settings.intelStayCost,
      maxInventory: settings.intelMaxInventory,
      plantMemory: settings.intelPlantMemory,
      creatureMemory: settings.intelCreatureMemory,
      observationRange: settings.intelObservationRange,
      communicationEnabled: settings.communicationEnabled,
      partnershipMinComboEnergy: settings.partnershipMinComboEnergy,
    },
  };
}

function settingsFromWorld(
  world: World,
  simulationSpeed = DEFAULT_SETTINGS.simulationSpeed,
): SimulationSettings {
  const config = world.config;
  const stats = world.getStats();
  return {
    gridSize: config.grid.width,
    targetPlantPopulation: config.targetPlantPopulation,
    plantSetMaxSize: config.plantSetMaxSize,
    simpleCreatures: stats.simpleCreatures,
    intelCreatures: stats.intelCreatures,
    enabledPlantTypes: config.enabledPlantTypes,
    hungerThreshold: config.hungerThreshold,
    initialCreatureEnergy: config.initialCreatureEnergy,
    simpleMovementCost: config.simple.movementCost,
    simpleStayCost: config.simple.stayCost,
    simpleMaxInventory: config.simple.maxInventory,
    intelMovementCost: config.intel.movementCost,
    intelStayCost: config.intel.stayCost,
    intelMaxInventory: config.intel.maxInventory,
    intelPlantMemory: config.intel.plantMemory,
    intelCreatureMemory: config.intel.creatureMemory,
    intelObservationRange: config.intel.observationRange,
    communicationEnabled: config.intel.communicationEnabled,
    partnershipMinComboEnergy: config.intel.partnershipMinComboEnergy,
    greenPlantEnergy: config.plantEnergy.green,
    redPlantEnergy: config.plantEnergy.red,
    yellowPlantEnergy: config.plantEnergy.yellow,
    magentaPlantEnergy: config.plantEnergy.magenta,
    comboOneEnergy: config.combinationEnergy["green-red"],
    comboTwoEnergy: config.combinationEnergy["yellow-red"],
    comboThreeEnergy: config.combinationEnergy["magenta-yellow"],
    advancedTerrainEnabled: config.advanced.terrainEnabled,
    advancedSeasonalCycleLength: config.advanced.seasonalCycleLength,
    advancedFertilityRegrowthRate: config.advanced.fertilityRegrowthRate,
    advancedMemoryDecayPerTick: config.advanced.memoryDecayPerTick,
    advancedGroupSizeLimit: config.advanced.groupSizeLimit,
    advancedStrategyCooperation: config.advanced.strategy.cooperation,
    advancedStrategyExploration: config.advanced.strategy.exploration,
    advancedStrategyExploitation: config.advanced.strategy.exploitation,
    advancedStrategyRiskAppetite: config.advanced.strategy.riskAppetite,
    advancedStrategyMemoryTrust: config.advanced.strategy.memoryTrust,
    advancedStrategyEnergyReserve: config.advanced.strategy.energyReserve,
    simulationSpeed,
  };
}
