import { Activity, BugPlay } from "lucide-react";
import type { WorldStats } from "../sim/core/World";

interface StatsPanelProps {
  mode: "classic" | "advanced";
  stats: WorldStats;
}

export function StatsPanel({ mode, stats }: StatsPanelProps) {
  return (
    <section className="statsPanel" aria-label="World statistics">
      <div className="brandRow">
        <BugPlay size={22} />
        <h1>AgentWorld</h1>
      </div>
      <div className="modePill">
        <Activity size={15} />
        {mode}
      </div>
      <dl className="stats">
        <Stat label="Tick" value={stats.tick} />
        <Stat label="Alive" value={stats.aliveCreatures} />
        <Stat label="Simple" value={stats.simpleCreatures} />
        <Stat label="Intel" value={stats.intelCreatures} />
        <Stat label="Pairs" value={stats.activePartnerships} />
        <Stat label="Dead" value={stats.deadCreatures} />
        <Stat label="Plants" value={stats.totalPlants} />
        <Stat label="Avg energy" value={stats.averageEnergy.toFixed(1)} />
        {mode === "advanced" ? (
          <>
            <Stat label="Season" value={stats.season} />
            <Stat
              label="Season progress"
              value={`${Math.round(stats.seasonProgress * 100)}%`}
            />
            <Stat
              label="Avg fertility"
              value={stats.averageFertility.toFixed(2)}
            />
          </>
        ) : null}
      </dl>
      <section className="memoryBlock statsBlock">
        <h3>Plant watchers</h3>
        <div className="plantWatchGrid">
          <PlantWatch label="Green" value={stats.plantCounts.green} />
          <PlantWatch label="Red" value={stats.plantCounts.red} />
          <PlantWatch label="Yellow" value={stats.plantCounts.yellow} />
          <PlantWatch label="Magenta" value={stats.plantCounts.magenta} />
        </div>
      </section>
    </section>
  );
}

interface StatProps {
  label: string;
  value: string | number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PlantWatch({ label, value }: StatProps) {
  return (
    <div className="plantWatch">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
