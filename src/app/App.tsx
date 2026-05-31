import { lazy, Suspense } from "react";
import { ControlPanel } from "../components/ControlPanel";
import { EventLogPanel } from "../components/EventLogPanel";
import { SelectedCreaturePanel } from "../components/SelectedCreaturePanel";
import { StatsPanel } from "../components/StatsPanel";
import { ClassicGridRenderer } from "../render/classic/ClassicGridRenderer";
import { useSimulationController } from "../state/useSimulationController";

const AdvancedWorld3D = lazy(() =>
  import("../render/three/AdvancedWorld3D").then((module) => ({
    default: module.AdvancedWorld3D,
  })),
);

export function App() {
  const {
    actions,
    overlays,
    recentEvents,
    running,
    selectedCell,
    selectedCreature,
    selectedCreatureId,
    settings,
    stats,
    world,
  } = useSimulationController();

  return (
    <main className="appShell">
      <section className="worldSurface">
        <ControlPanel
          mode={world.config.mode}
          onAddIntelCreature={() => actions.addCreature("intel")}
          onAddPlants={() => actions.addPlants()}
          onAddSimpleCreature={() => actions.addCreature("simple")}
          onClearPlants={actions.clearPlants}
          onClearWorld={actions.clearWorld}
          onCaptureSnapshot={actions.captureSnapshot}
          onLoadSnapshot={actions.loadSnapshot}
          onReset={() => actions.reset()}
          onRestoreAdvancedDefaults={actions.restoreAdvancedDefaults}
          onRestoreClassicDefaults={actions.restoreClassicDefaults}
          onRestoreOverlayDefaults={actions.restoreOverlayDefaults}
          onSetRunning={actions.setRunning}
          onStep={actions.stepOnce}
          onToggleMode={actions.toggleMode}
          onToggleOverlay={actions.toggleOverlay}
          onUpdateSetting={actions.updateSetting}
          overlays={overlays}
          running={running}
          settings={settings}
        />
        {world.config.mode === "advanced" ? (
          <Suspense fallback={<div className="advancedLoading">Loading 3D world</div>}>
            <AdvancedWorld3D
              onSelectCreature={actions.selectCreature}
              overlays={overlays}
              selectedCreatureId={selectedCreatureId}
              tick={stats.tick}
              world={world}
            />
          </Suspense>
        ) : (
          <ClassicGridRenderer
            onSelectCell={actions.selectCell}
            onSelectCreature={actions.selectCreature}
            overlays={overlays}
            selectedCell={selectedCell}
            selectedCreatureId={selectedCreatureId}
            world={world}
          />
        )}
      </section>

      <aside className="sidePanel">
        <StatsPanel mode={world.config.mode} stats={stats} />
        <SelectedCreaturePanel
          onAdjustCreatureEnergy={actions.adjustCreatureEnergy}
          onAddIntelAtCell={(position) => actions.addCreature("intel", position)}
          onAddPlantAtCell={actions.addPlantAtCell}
          onAddSimpleAtCell={(position) => actions.addCreature("simple", position)}
          onClearCellCreatures={actions.clearCellCreatures}
          onClearCellPlants={actions.clearCellPlants}
          creature={selectedCreature}
          onRemoveCreature={actions.removeCreature}
          onRemovePlant={actions.removePlant}
          onSelectCell={actions.selectCell}
          onSelectCreature={actions.selectCreature}
          selectedCell={selectedCell}
          tick={stats.tick}
          world={world}
        />
        <EventLogPanel events={recentEvents} onClear={actions.clearEventLog} />
      </aside>
    </main>
  );
}
