import { useState, type ReactNode } from "react";
import {
  Brain,
  Compass,
  Eraser,
  Eye,
  Footprints,
  Gauge,
  Leaf,
  Link2,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  RotateCcw,
  Rows3,
  ScanSearch,
  StepForward,
  Target,
  Trash2,
  Trees,
  Users,
  Zap,
} from "lucide-react";
import type {
  OverlaySettings,
  SimulationSettings,
} from "../state/useSimulationController";

interface ControlPanelProps {
  mode: "classic" | "advanced";
  running: boolean;
  settings: SimulationSettings;
  overlays: OverlaySettings;
  onAddIntelCreature: () => void;
  onAddPlants: () => void;
  onAddSimpleCreature: () => void;
  onClearPlants: () => void;
  onClearWorld: () => void;
  onReset: () => void;
  onSetRunning: (running: boolean) => void;
  onStep: () => void;
  onCaptureSnapshot: () => string;
  onLoadSnapshot: (snapshotText: string) => void;
  onToggleMode: () => void;
  onToggleOverlay: (key: keyof OverlaySettings) => void;
  onRestoreAdvancedDefaults: () => void;
  onRestoreClassicDefaults: () => void;
  onRestoreOverlayDefaults: () => void;
  onUpdateSetting: <K extends keyof SimulationSettings>(
    key: K,
    value: SimulationSettings[K],
  ) => void;
}

export function ControlPanel({
  mode,
  running,
  settings,
  overlays,
  onAddIntelCreature,
  onAddPlants,
  onAddSimpleCreature,
  onClearPlants,
  onClearWorld,
  onReset,
  onSetRunning,
  onStep,
  onCaptureSnapshot,
  onLoadSnapshot,
  onRestoreAdvancedDefaults,
  onRestoreClassicDefaults,
  onRestoreOverlayDefaults,
  onToggleMode,
  onToggleOverlay,
  onUpdateSetting,
}: ControlPanelProps) {
  const [snapshotText, setSnapshotText] = useState("");
  const [snapshotStatus, setSnapshotStatus] = useState<string | null>(null);

  function handleCaptureSnapshot() {
    setSnapshotText(onCaptureSnapshot());
    setSnapshotStatus("Snapshot captured from current world state.");
  }

  function handleLoadSnapshot() {
    try {
      onLoadSnapshot(snapshotText);
      setSnapshotStatus("Snapshot loaded into the simulation.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load snapshot.";
      setSnapshotStatus(message);
    }
  }

  return (
    <section className="controlPanel" aria-label="Simulation controls">
      <div className="buttonGrid">
        <button type="button" onClick={() => onSetRunning(!running)}>
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pause" : "Start"}
        </button>
        <button type="button" onClick={onStep}>
          <StepForward size={16} />
          Step
        </button>
        <button type="button" onClick={onReset}>
          <RotateCcw size={16} />
          Reset
        </button>
        <button type="button" onClick={onToggleMode}>
          <Zap size={16} />
          {mode === "classic" ? "Advanced" : "Classic"}
        </button>
        <button type="button" onClick={onAddSimpleCreature}>
          <Plus size={16} />
          Simple
        </button>
        <button type="button" onClick={onAddIntelCreature}>
          <Brain size={16} />
          Intel
        </button>
        <button type="button" onClick={onAddPlants}>
          <Leaf size={16} />
          Plants
        </button>
        <button type="button" onClick={onClearPlants}>
          <Eraser size={16} />
          Clear plants
        </button>
        <button type="button" onClick={onClearWorld}>
          <Trash2 size={16} />
          Clear world
        </button>
      </div>

      <section className="presetStrip" aria-label="Simulation presets">
        <div className="presetSummary">
          <span className="presetKicker">
            {mode === "classic" ? "Classic focus" : "Advanced focus"}
          </span>
          <p>
            {mode === "classic"
              ? "Reset legacy tuning quickly without touching overlays or snapshots."
              : "Reset environmental hooks independently from Classic creature rules."}
          </p>
        </div>
        <div className="presetButtons">
          <button type="button" onClick={onRestoreClassicDefaults}>
            Classic defaults
          </button>
          <button type="button" onClick={onRestoreAdvancedDefaults}>
            Advanced defaults
          </button>
          <button type="button" onClick={onRestoreOverlayDefaults}>
            Overlay defaults
          </button>
        </div>
      </section>

      <div className="controlSections">
        <ControlSection
          defaultOpen
          subtitle="Legacy shell controls and loop speed."
          summary={`${settings.gridSize}x${settings.gridSize} grid | ${settings.targetPlantPopulation} plants | ${settings.simulationSpeed}x`}
          title="World"
        >
          <RangeControl
            icon={<Rows3 size={16} />}
            label="Grid"
            max={14}
            min={3}
            onChange={(value) => onUpdateSetting("gridSize", value)}
            value={settings.gridSize}
          />
          <RangeControl
            icon={<Leaf size={16} />}
            label="Plant target"
            max={80}
            min={0}
            onChange={(value) => onUpdateSetting("targetPlantPopulation", value)}
            value={settings.targetPlantPopulation}
          />
          <RangeControl
            icon={<Leaf size={16} />}
            label="Plant batch"
            max={8}
            min={1}
            onChange={(value) => onUpdateSetting("plantSetMaxSize", value)}
            value={settings.plantSetMaxSize}
          />
          <RangeControl
            icon={<Trees size={16} />}
            label="Plant types"
            max={4}
            min={1}
            onChange={(value) => onUpdateSetting("enabledPlantTypes", value)}
            value={settings.enabledPlantTypes}
          />
          <RangeControl
            icon={<RefreshCw size={16} />}
            label="Speed"
            max={30}
            min={1}
            onChange={(value) => onUpdateSetting("simulationSpeed", value)}
            value={settings.simulationSpeed}
          />
          <NumberControl
            icon={<Users size={16} />}
            label="Simple alive"
            min={0}
            onChange={(value) => onUpdateSetting("simpleCreatures", value)}
            value={settings.simpleCreatures}
          />
          <NumberControl
            icon={<Brain size={16} />}
            label="Intel alive"
            min={0}
            onChange={(value) => onUpdateSetting("intelCreatures", value)}
            value={settings.intelCreatures}
          />
        </ControlSection>

        <ControlSection
          defaultOpen
          subtitle="Classic movement, hunger, and carry limits."
          summary={`${settings.simpleCreatures} simple | ${settings.intelCreatures} intel`}
          title="Creatures"
        >
          <NumberControl
            icon={<Zap size={16} />}
            label="Initial energy"
            min={1}
            onChange={(value) => onUpdateSetting("initialCreatureEnergy", value)}
            value={settings.initialCreatureEnergy}
          />
          <NumberControl
            icon={<Gauge size={16} />}
            label="Hunger threshold"
            min={0}
            onChange={(value) => onUpdateSetting("hungerThreshold", value)}
            value={settings.hungerThreshold}
          />
          <NumberControl
            icon={<Footprints size={16} />}
            label="Simple move cost"
            min={0}
            onChange={(value) => onUpdateSetting("simpleMovementCost", value)}
            value={settings.simpleMovementCost}
          />
          <NumberControl
            icon={<Gauge size={16} />}
            label="Simple stay cost"
            min={0}
            onChange={(value) => onUpdateSetting("simpleStayCost", value)}
            value={settings.simpleStayCost}
          />
          <NumberControl
            icon={<Leaf size={16} />}
            label="Simple carry max"
            min={1}
            onChange={(value) => onUpdateSetting("simpleMaxInventory", value)}
            value={settings.simpleMaxInventory}
          />
          <NumberControl
            icon={<Footprints size={16} />}
            label="Intel move cost"
            min={0}
            onChange={(value) => onUpdateSetting("intelMovementCost", value)}
            value={settings.intelMovementCost}
          />
          <NumberControl
            icon={<Gauge size={16} />}
            label="Intel stay cost"
            min={0}
            onChange={(value) => onUpdateSetting("intelStayCost", value)}
            value={settings.intelStayCost}
          />
          <NumberControl
            icon={<Leaf size={16} />}
            label="Intel carry max"
            min={1}
            onChange={(value) => onUpdateSetting("intelMaxInventory", value)}
            value={settings.intelMaxInventory}
          />
        </ControlSection>

        <ControlSection
          defaultOpen
          title="Intel"
          subtitle="Memory, sensing, and communication controls."
          summary={`${settings.intelPlantMemory}/${settings.intelCreatureMemory} memory | range ${settings.intelObservationRange} | pair ${settings.partnershipMinComboEnergy}`}
        >
          <NumberControl
            icon={<Brain size={16} />}
            label="Plant memory"
            min={1}
            onChange={(value) => onUpdateSetting("intelPlantMemory", value)}
            value={settings.intelPlantMemory}
          />
          <NumberControl
            icon={<Users size={16} />}
            label="Creature memory"
            min={1}
            onChange={(value) => onUpdateSetting("intelCreatureMemory", value)}
            value={settings.intelCreatureMemory}
          />
          <NumberControl
            icon={<ScanSearch size={16} />}
            label="Observation range"
            min={0}
            onChange={(value) => onUpdateSetting("intelObservationRange", value)}
            value={settings.intelObservationRange}
          />
          <ToggleField
            active={settings.communicationEnabled}
            icon={<Radio size={16} />}
            label="Communication"
            onClick={() =>
              onUpdateSetting("communicationEnabled", !settings.communicationEnabled)
            }
          />
          <NumberControl
            icon={<Link2 size={16} />}
            label="Partnership threshold"
            min={0}
            onChange={(value) => onUpdateSetting("partnershipMinComboEnergy", value)}
            value={settings.partnershipMinComboEnergy}
          />
        </ControlSection>

        <ControlSection
          defaultOpen
          title="Plant Energy"
          subtitle="Applies to newly spawned plants and detached test plants."
          summary={`G ${settings.greenPlantEnergy} | R ${settings.redPlantEnergy} | Y ${settings.yellowPlantEnergy} | M ${settings.magentaPlantEnergy}`}
        >
          <NumberControl
            icon={<Leaf size={16} />}
            label="Green"
            min={0}
            onChange={(value) => onUpdateSetting("greenPlantEnergy", value)}
            value={settings.greenPlantEnergy}
          />
          <NumberControl
            icon={<Leaf size={16} />}
            label="Red"
            min={0}
            onChange={(value) => onUpdateSetting("redPlantEnergy", value)}
            value={settings.redPlantEnergy}
          />
          <NumberControl
            icon={<Leaf size={16} />}
            label="Yellow"
            min={0}
            onChange={(value) => onUpdateSetting("yellowPlantEnergy", value)}
            value={settings.yellowPlantEnergy}
          />
          <NumberControl
            icon={<Leaf size={16} />}
            label="Magenta"
            min={0}
            onChange={(value) => onUpdateSetting("magentaPlantEnergy", value)}
            value={settings.magentaPlantEnergy}
          />
        </ControlSection>

        <ControlSection
          defaultOpen
          title="Combo Rewards"
          subtitle="Classic combination reward tuning."
          summary={`${settings.comboOneEnergy} | ${settings.comboTwoEnergy} | ${settings.comboThreeEnergy}`}
        >
          <NumberControl
            icon={<Zap size={16} />}
            label="Green + red"
            min={0}
            onChange={(value) => onUpdateSetting("comboOneEnergy", value)}
            value={settings.comboOneEnergy}
          />
          <NumberControl
            icon={<Zap size={16} />}
            label="Yellow + red"
            min={0}
            onChange={(value) => onUpdateSetting("comboTwoEnergy", value)}
            value={settings.comboTwoEnergy}
          />
          <NumberControl
            icon={<Zap size={16} />}
            label="Magenta + yellow"
            min={0}
            onChange={(value) => onUpdateSetting("comboThreeEnergy", value)}
            value={settings.comboThreeEnergy}
          />
        </ControlSection>

        <ControlSection
          defaultOpen={mode === "advanced"}
          title="Advanced"
          subtitle="Terrain, seasonal cadence, memory decay, and intel strategy."
          summary={`${settings.advancedTerrainEnabled ? "terrain on" : "terrain off"} | season ${settings.advancedSeasonalCycleLength} | group ${settings.advancedGroupSizeLimit} | coop ${settings.advancedStrategyCooperation.toFixed(1)}`}
        >
          <ToggleField
            active={settings.advancedTerrainEnabled}
            icon={<Trees size={16} />}
            label="Terrain fertility"
            onClick={() =>
              onUpdateSetting(
                "advancedTerrainEnabled",
                !settings.advancedTerrainEnabled,
              )
            }
          />
          <NumberControl
            icon={<RefreshCw size={16} />}
            label="Season length"
            min={4}
            onChange={(value) =>
              onUpdateSetting("advancedSeasonalCycleLength", value)
            }
            value={settings.advancedSeasonalCycleLength}
          />
          <NumberControl
            icon={<Trees size={16} />}
            label="Fertility regrowth"
            min={0}
            onChange={(value) =>
              onUpdateSetting("advancedFertilityRegrowthRate", value)
            }
            step={0.01}
            value={settings.advancedFertilityRegrowthRate}
          />
          <NumberControl
            icon={<Brain size={16} />}
            label="Memory decay"
            min={0}
            onChange={(value) =>
              onUpdateSetting("advancedMemoryDecayPerTick", value)
            }
            step={0.01}
            value={settings.advancedMemoryDecayPerTick}
          />
          <NumberControl
            icon={<Users size={16} />}
            label="Group size limit"
            min={2}
            onChange={(value) =>
              onUpdateSetting("advancedGroupSizeLimit", value)
            }
            value={settings.advancedGroupSizeLimit}
          />
          <NumberControl
            icon={<Users size={16} />}
            label="Cooperation"
            min={0}
            onChange={(value) =>
              onUpdateSetting("advancedStrategyCooperation", value)
            }
            step={0.1}
            value={settings.advancedStrategyCooperation}
          />
          <NumberControl
            icon={<Compass size={16} />}
            label="Exploration"
            min={0}
            onChange={(value) =>
              onUpdateSetting("advancedStrategyExploration", value)
            }
            step={0.1}
            value={settings.advancedStrategyExploration}
          />
          <NumberControl
            icon={<Target size={16} />}
            label="Exploitation"
            min={0}
            onChange={(value) =>
              onUpdateSetting("advancedStrategyExploitation", value)
            }
            step={0.1}
            value={settings.advancedStrategyExploitation}
          />
          <NumberControl
            icon={<Footprints size={16} />}
            label="Risk appetite"
            min={0}
            onChange={(value) =>
              onUpdateSetting("advancedStrategyRiskAppetite", value)
            }
            step={0.1}
            value={settings.advancedStrategyRiskAppetite}
          />
          <NumberControl
            icon={<Eye size={16} />}
            label="Memory trust"
            min={0}
            onChange={(value) =>
              onUpdateSetting("advancedStrategyMemoryTrust", value)
            }
            step={0.1}
            value={settings.advancedStrategyMemoryTrust}
          />
          <NumberControl
            icon={<Gauge size={16} />}
            label="Energy reserve"
            min={0}
            onChange={(value) =>
              onUpdateSetting("advancedStrategyEnergyReserve", value)
            }
            step={0.1}
            value={settings.advancedStrategyEnergyReserve}
          />
        </ControlSection>

        <ControlSection
          defaultOpen={false}
          title="Snapshots"
          subtitle="Capture or load deterministic debug state as JSON."
          summary="Capture, paste, and replay serialized worlds"
        >
          <label className="snapshotControl">
            <span className="fieldLabel">Serialized world</span>
            <textarea
              onChange={(event) => setSnapshotText(event.target.value)}
              placeholder="Capture a snapshot or paste one here to load it."
              rows={8}
              value={snapshotText}
            />
          </label>
          <div className="snapshotActions">
            <button type="button" onClick={handleCaptureSnapshot}>
              Capture
            </button>
            <button type="button" onClick={handleLoadSnapshot}>
              Load
            </button>
            <button
              type="button"
              onClick={() => {
                setSnapshotText("");
                setSnapshotStatus(null);
              }}
            >
              Clear
            </button>
          </div>
          {snapshotStatus ? <p className="snapshotStatus">{snapshotStatus}</p> : null}
        </ControlSection>
      </div>

      <div className="toggleRow">
        <ToggleButton
          active={overlays.debug}
          icon={<Eye size={16} />}
          label="Debug"
          onClick={() => onToggleOverlay("debug")}
        />
        <ToggleButton
          active={overlays.energy}
          icon={<Zap size={16} />}
          label="Energy"
          onClick={() => onToggleOverlay("energy")}
        />
        <ToggleButton
          active={overlays.fertility}
          icon={<Trees size={16} />}
          label="Fertility"
          onClick={() => onToggleOverlay("fertility")}
        />
        <ToggleButton
          active={overlays.intent}
          icon={<Target size={16} />}
          label="Intent"
          onClick={() => onToggleOverlay("intent")}
        />
        <ToggleButton
          active={overlays.memory}
          icon={<Brain size={16} />}
          label="Memory"
          onClick={() => onToggleOverlay("memory")}
        />
        <ToggleButton
          active={overlays.relationships}
          icon={<Users size={16} />}
          label="Links"
          onClick={() => onToggleOverlay("relationships")}
        />
      </div>
    </section>
  );
}

function ControlSection({
  children,
  defaultOpen = true,
  subtitle,
  summary,
  title,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  subtitle: string;
  summary: string;
  title: string;
}) {
  return (
    <details className="controlSection" open={defaultOpen}>
      <summary className="sectionSummary">
        <div className="sectionHeader">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="sectionBadge">{summary}</span>
      </summary>
      <div className="fieldGrid">{children}</div>
    </details>
  );
}

interface RangeControlProps {
  icon: ReactNode;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}

function RangeControl({
  icon,
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
}: RangeControlProps) {
  return (
    <label className="rangeControl">
      <span className="fieldLabel">
        {icon}
        {label}
      </span>
      <input
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
      <output>{value}</output>
    </label>
  );
}

interface NumberControlProps {
  icon: ReactNode;
  label: string;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
}

function NumberControl({
  icon,
  label,
  min,
  onChange,
  step = 1,
  value,
}: NumberControlProps) {
  return (
    <label className="numberControl">
      <span className="fieldLabel">
        {icon}
        {label}
      </span>
      <input
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

interface ToggleButtonProps {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function ToggleButton({ active, icon, label, onClick }: ToggleButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={active ? "toggleButton active" : "toggleButton"}
      onClick={onClick}
      type="button"
    >
      {icon}
      {label}
    </button>
  );
}

function ToggleField({ active, icon, label, onClick }: ToggleButtonProps) {
  return (
    <button
      aria-pressed={active}
      className={active ? "toggleField active" : "toggleField"}
      onClick={onClick}
      type="button"
    >
      <span className="fieldLabel">
        {icon}
        {label}
      </span>
      <span>{active ? "On" : "Off"}</span>
    </button>
  );
}
