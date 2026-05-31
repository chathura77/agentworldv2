import type { SimulationEvent } from "../sim/inspection/eventLog";

interface EventLogPanelProps {
  events: SimulationEvent[];
  onClear: () => void;
}

export function EventLogPanel({ events, onClear }: EventLogPanelProps) {
  const orderedEvents = events.slice().reverse();

  return (
    <section className="eventLogPanel" aria-label="Simulation event log">
      <div className="panelHeaderRow">
        <h2>Event log</h2>
        <div className="eventLogHeaderActions">
          <span className="selectionCount">{events.length} recorded</span>
          <button onClick={onClear} type="button">
            Clear
          </button>
        </div>
      </div>
      {events.length === 0 ? (
        <p className="emptySelection">No events recorded yet</p>
      ) : (
        <ol className="eventLogList" reversed>
          {orderedEvents.map((event) => (
            <li key={event.id}>
              <span className="eventTick">Tick {event.tick}</span>
              <p>{event.summary}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
