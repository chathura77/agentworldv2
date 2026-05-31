import {
  ArrowRight,
  Brain,
  CircleDot,
  Compass,
  Eye,
  Footprints,
  Gauge,
  Leaf,
  Link2,
  MapPinned,
  Target,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { findBestCombo, findComboWithPlant } from "../sim/ai/combinations";
import type { World } from "../sim";
import type { CreatureMemory, PlantMemory } from "../sim/ai/memory";
import type { Creature } from "../sim/entities/Creature";
import { IntelCreature } from "../sim/entities/IntelCreature";
import type { PlantType, Position } from "../sim/entities/types";
import type { CommunicationMessage } from "../sim/communication/messages";

interface SelectedCreaturePanelProps {
  onAdjustCreatureEnergy: (id: string, delta: number) => void;
  creature: Creature | null;
  onAddIntelAtCell: (position: Position) => void;
  onAddPlantAtCell: (type: PlantType, position: Position) => void;
  onAddSimpleAtCell: (position: Position) => void;
  onClearCellCreatures: (position: Position) => void;
  onClearCellPlants: (position: Position) => void;
  onRemoveCreature: (id: string) => void;
  onRemovePlant: (id: string) => void;
  onSelectCell: (position: Position | null) => void;
  onSelectCreature: (id: string | null) => void;
  selectedCell: Position | null;
  tick: number;
  world: World;
}

export function SelectedCreaturePanel({
  onAdjustCreatureEnergy,
  creature,
  onAddIntelAtCell,
  onAddPlantAtCell,
  onAddSimpleAtCell,
  onClearCellCreatures,
  onClearCellPlants,
  onRemoveCreature,
  onRemovePlant,
  onSelectCell,
  onSelectCreature,
  selectedCell,
  tick,
  world,
}: SelectedCreaturePanelProps) {
  const aliveCreatures = world.creatures
    .filter((entry) => entry.alive)
    .sort((left, right) => left.id.localeCompare(right.id));

  if (!creature) {
    return (
      <section className="selectedPanel" aria-label="Selected creature">
        <div className="panelHeaderRow">
          <h2>Selection</h2>
          <span className="selectionCount">{aliveCreatures.length} alive</span>
        </div>
        <p className="emptySelection">No creature selected</p>
        <SelectedCellPanel
          onAddIntelAtCell={onAddIntelAtCell}
          onAddPlantAtCell={onAddPlantAtCell}
          onAddSimpleAtCell={onAddSimpleAtCell}
          onClearCellCreatures={onClearCellCreatures}
          onClearCellPlants={onClearCellPlants}
          creature={null}
          onRemoveCreature={onRemoveCreature}
          onRemovePlant={onRemovePlant}
          onSelectCell={onSelectCell}
          onSelectCreature={onSelectCreature}
          selectedCell={selectedCell}
          world={world}
        />
        <CreatureRoster
          creatures={aliveCreatures}
          onSelectCreature={onSelectCreature}
          selectedCreatureId={null}
        />
      </section>
    );
  }

  const intel = creature instanceof IntelCreature ? creature : null;
  const movedThisTick =
    creature.position.x !== creature.previousPosition.x ||
    creature.position.y !== creature.previousPosition.y;
  const inventoryLimit =
    creature.kind === "intel"
      ? world.config.intel.maxInventory
      : world.config.simple.maxInventory;
  const inventoryEnergy = creature.inventory.reduce((sum, plant) => sum + plant.energy, 0);
  const currentCellPlants = world.plants.filter(
    (plant) =>
      plant.position.x === creature.position.x && plant.position.y === creature.position.y,
  );
  const visibleCells = world.grid.ahead(
    creature.position,
    creature.facing,
    intel ? world.config.intel.observationRange : 0,
  );
  const facingPosition =
    world.grid.ahead(creature.position, creature.facing, 1)[1] ?? creature.position;
  const visibleCellRecords = visibleCells.map((position) => {
    const plants = world.plants.filter(
      (plant) => plant.position.x === position.x && plant.position.y === position.y,
    );
    const creatures = world.creatures.filter(
      (entry) => entry.alive && entry.position.x === position.x && entry.position.y === position.y,
    );
    return {
      creatures,
      fertility: world.getFertility(position),
      isCurrent: position.x === creature.position.x && position.y === creature.position.y,
      isFacing: position.x === facingPosition.x && position.y === facingPosition.y,
      plants,
      position,
    };
  });
  const desiredPlant = intel ? world.getPlant(intel.desiredPlantId) : null;
  const linkedCreature = intel
    ? world.getCreature(intel.partnerId ?? intel.leaderId)
    : null;
  const groupMembers = intel
    ? intel.groupMemberIds
        .map((memberId) => world.getCreature(memberId))
        .filter((entry): entry is Creature => entry !== null && entry.alive)
    : [];
  const hungerState =
    creature.energy < world.config.hungerThreshold ? "hungry" : "steady";
  const recentMessages = world.getCommunicationMessages({
    creatureId: creature.id,
    limit: 6,
  });
  const bestInventoryCombo = findBestCombo(creature.inventory, world.config);
  const desiredPlantCombo =
    intel && desiredPlant
      ? findComboWithPlant(creature.inventory, desiredPlant.type, world.config)
      : null;
  const targetStatus = describeTargetStatus({
    desiredPlant,
    desiredPlantId: intel?.desiredPlantId ?? null,
    memory: intel?.plantMemory ?? [],
    visibleCells,
  });

  return (
    <section className="selectedPanel" aria-label="Selected creature">
      <div className="panelHeaderRow">
        <h2>{creature.id}</h2>
        <div className="selectionActions">
          <button type="button" onClick={() => onSelectCreature(null)}>
            Clear
          </button>
          {linkedCreature ? (
            <button type="button" onClick={() => onSelectCreature(linkedCreature.id)}>
              Select linked
            </button>
          ) : null}
        </div>
      </div>
      <dl className="detailList">
        <Detail icon={<CircleDot size={15} />} label="Type" value={creature.kind} />
        <Detail icon={<Zap size={15} />} label="Energy" value={creature.energy} />
        <Detail
          icon={<MapPinned size={15} />}
          label="Position"
          value={formatPosition(creature.position)}
        />
        <Detail
          icon={<ArrowRight size={15} />}
          label="Previous"
          value={formatPosition(creature.previousPosition)}
        />
        <Detail icon={<Compass size={15} />} label="Facing" value={creature.facing} />
        <Detail icon={<Brain size={15} />} label="Mode" value={creature.mode} />
        <Detail
          icon={<Leaf size={15} />}
          label="Inventory"
          value={`${formatInventorySummary(creature)} (${creature.inventory.length}/${inventoryLimit})`}
        />
        <Detail
          icon={<Target size={15} />}
          label="Hunger"
          value={hungerState}
        />
        <Detail
          icon={<Gauge size={15} />}
          label="Carry energy"
          value={inventoryEnergy}
        />
        <Detail
          icon={<Link2 size={15} />}
          label="Role"
          value={formatRelationshipRole(intel)}
        />
        <Detail
          icon={<Link2 size={15} />}
          label="Linked"
          value={intel?.partnerId ?? intel?.leaderId ?? "none"}
        />
        <Detail
          icon={<Footprints size={15} />}
          label="Moved"
          value={movedThisTick ? "yes" : "no"}
        />
      </dl>

      <section className="memoryBlock">
        <h3>Inventory detail</h3>
        <p>{formatInventoryDetail(creature)}</p>
        <p>Current cell plants: {formatPlantList(currentCellPlants)}</p>
        <p>Cell fertility: {world.getFertility(creature.position).toFixed(2)}</p>
      </section>

      <section className="memoryBlock">
        <h3>Status</h3>
        <p>Hunger threshold: {world.config.hungerThreshold}</p>
        <p>Visible cells: {visibleCells.map(formatPosition).join(" -> ")}</p>
        <p>
          Move cost:{" "}
          {creature.kind === "intel"
            ? world.config.intel.movementCost
            : world.config.simple.movementCost}
          {" "}|
          {" "}Stay cost:{" "}
          {creature.kind === "intel"
            ? world.config.intel.stayCost
            : world.config.simple.stayCost}
        </p>
        <div className="selectionActions detailActions">
          <button onClick={() => onAdjustCreatureEnergy(creature.id, -25)} type="button">
            Drain 25
          </button>
          <button onClick={() => onAdjustCreatureEnergy(creature.id, 25)} type="button">
            Boost 25
          </button>
          <button onClick={() => onRemoveCreature(creature.id)} type="button">
            Remove creature
          </button>
          <button onClick={() => onSelectCell(creature.position)} type="button">
            Pin current
          </button>
          <button onClick={() => onSelectCell(creature.previousPosition)} type="button">
            Pin previous
          </button>
          <button onClick={() => onSelectCell(facingPosition)} type="button">
            Pin facing
          </button>
          {desiredPlant ? (
            <button onClick={() => onSelectCell(desiredPlant.position)} type="button">
              Pin target
            </button>
          ) : null}
          {linkedCreature ? (
            <button
              onClick={() => {
                onSelectCreature(linkedCreature.id);
                onSelectCell(linkedCreature.position);
              }}
              type="button"
            >
              Pin linked
            </button>
          ) : null}
        </div>
      </section>

      <section className="memoryBlock">
        <h3>Target analysis</h3>
        <p>Target status: {targetStatus}</p>
        <p>Best carried combo: {formatComboSummary(bestInventoryCombo)}</p>
        <p>Target combo path: {formatComboSummary(desiredPlantCombo, desiredPlant?.type)}</p>
      </section>

      <section className="memoryBlock">
        <h3>Visible cells</h3>
        {visibleCellRecords.length === 0 ? (
          <p>None</p>
        ) : (
          <ul className="memoryList">
            {visibleCellRecords.map((cell) => (
              <li key={formatPosition(cell.position)}>
                <div className="memoryListRow">
                  <span>
                    {formatPosition(cell.position)}
                    {" "}
                    | {formatVisibleCellFlags(cell)}
                    {" "}
                    | plants {cell.plants.length}
                    {" "}
                    | creatures {cell.creatures.length}
                    {" "}
                    | fertility {cell.fertility.toFixed(2)}
                  </span>
                  <span className="memoryActions">
                    <button onClick={() => onSelectCell(cell.position)} type="button">
                      Pin
                    </button>
                    {cell.creatures[0] ? (
                      <button
                        onClick={() => {
                          onSelectCreature(cell.creatures[0].id);
                          onSelectCell(cell.position);
                        }}
                        type="button"
                      >
                        Select
                      </button>
                    ) : null}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="memoryBlock">
        <h3>Communication</h3>
        {recentMessages.length === 0 ? (
          <p>No recent messages</p>
        ) : (
          <ul className="memoryList">
            {recentMessages
              .slice()
              .reverse()
              .map((message) => (
                <li key={message.id}>{formatCommunicationMessage(message)}</li>
              ))}
          </ul>
        )}
      </section>

      <SelectedCellPanel
        onAddIntelAtCell={onAddIntelAtCell}
        onAddPlantAtCell={onAddPlantAtCell}
        onAddSimpleAtCell={onAddSimpleAtCell}
        onClearCellCreatures={onClearCellCreatures}
        onClearCellPlants={onClearCellPlants}
        creature={creature}
        onRemoveCreature={onRemoveCreature}
        onRemovePlant={onRemovePlant}
        onSelectCell={onSelectCell}
        onSelectCreature={onSelectCreature}
        selectedCell={selectedCell}
        world={world}
      />

      {intel ? (
        <>
          <section className="memoryBlock">
            <h3>Intel state</h3>
            <p>
              Pursuit target:{" "}
              {desiredPlant
                ? `${desiredPlant.id} ${desiredPlant.type} @ ${formatPosition(desiredPlant.position)}`
                : "none"}
            </p>
            <p>Desired combo: {intel.desiredCombo ?? "none"}</p>
            <p>Requested plant: {intel.requestedPlantId ?? "none"}</p>
            <p>Group: {intel.groupId ?? "none"}</p>
            <p>
              Group size: {groupMembers.length + 1} / {world.config.advanced.groupSizeLimit}
            </p>
            <p>Group members: {formatGroupMembers(groupMembers)}</p>
            <p>
              Plant memory: {intel.plantMemory.length} / {world.config.intel.plantMemory}
            </p>
            <p>
              Creature memory: {intel.creatureMemory.length} / {world.config.intel.creatureMemory}
            </p>
            <p>Observation range: {world.config.intel.observationRange}</p>
            <p>Partnership threshold: {world.config.intel.partnershipMinComboEnergy}</p>
            <p>Linked creature: {formatLinkedCreature(linkedCreature)}</p>
            {world.config.mode === "advanced" ? (
              <p>
                Strategy:{" "}
                {formatStrategySummary(world.config.advanced.strategy)}
              </p>
            ) : null}
          </section>
          <MemoryList
            entries={intel.plantMemory}
            icon={<Eye size={15} />}
            onSelectCell={onSelectCell}
            onSelectCreature={onSelectCreature}
            tick={tick}
            title="Remembered plants"
            world={world}
          />
          <MemoryList
            entries={intel.creatureMemory}
            icon={<Brain size={15} />}
            onSelectCell={onSelectCell}
            onSelectCreature={onSelectCreature}
            tick={tick}
            title="Remembered creatures"
            world={world}
          />
        </>
      ) : null}

      <CreatureRoster
        creatures={aliveCreatures}
        onSelectCreature={onSelectCreature}
        selectedCreatureId={creature.id}
      />
    </section>
  );
}

function SelectedCellPanel({
  creature,
  onAddIntelAtCell,
  onAddPlantAtCell,
  onAddSimpleAtCell,
  onClearCellCreatures,
  onClearCellPlants,
  onRemoveCreature,
  onRemovePlant,
  onSelectCell,
  onSelectCreature,
  selectedCell,
  world,
}: {
  creature: Creature | null;
  onAddIntelAtCell: (position: Position) => void;
  onAddPlantAtCell: (type: PlantType, position: Position) => void;
  onAddSimpleAtCell: (position: Position) => void;
  onClearCellCreatures: (position: Position) => void;
  onClearCellPlants: (position: Position) => void;
  onRemoveCreature: (id: string) => void;
  onRemovePlant: (id: string) => void;
  onSelectCell: (position: Position | null) => void;
  onSelectCreature: (id: string | null) => void;
  selectedCell: Position | null;
  world: World;
}) {
  if (!selectedCell) {
    return null;
  }

  const plants = world.plants.filter(
    (plant) =>
      plant.position.x === selectedCell.x && plant.position.y === selectedCell.y,
  );
  const creatures = world.creatures.filter(
    (entry) =>
      entry.alive &&
      entry.position.x === selectedCell.x &&
      entry.position.y === selectedCell.y,
  );
  const intel = creature instanceof IntelCreature ? creature : null;
  const isCreatureCell =
    creature?.position.x === selectedCell.x && creature.position.y === selectedCell.y;
  const isObservedCell =
    creature !== null &&
    world.grid
      .ahead(
        creature.position,
        creature.facing,
        intel ? world.config.intel.observationRange : 0,
      )
      .some(
        (position) =>
          position.x === selectedCell.x && position.y === selectedCell.y,
      );
  const isTargetCell =
    intel !== null &&
    world.getPlant(intel.desiredPlantId)?.position.x === selectedCell.x &&
    world.getPlant(intel.desiredPlantId)?.position.y === selectedCell.y;
  const isPlantMemoryCell =
    intel?.plantMemory.some(
      (entry) =>
        entry.position.x === selectedCell.x && entry.position.y === selectedCell.y,
    ) ?? false;
  const isCreatureMemoryCell =
    intel?.creatureMemory.some(
      (entry) =>
        entry.position.x === selectedCell.x && entry.position.y === selectedCell.y,
    ) ?? false;

  return (
    <section className="memoryBlock">
      <div className="panelHeaderRow">
        <h3>Pinned cell {formatPosition(selectedCell)}</h3>
        <button onClick={() => onSelectCell(null)} type="button">
          Clear
        </button>
      </div>
      <p>
        Plants {plants.length} | Creatures {creatures.length} | Fertility{" "}
        {world.getFertility(selectedCell).toFixed(2)}
      </p>
      <p>
        Flags{" "}
        {formatCellFlags({
          isCreatureCell,
          isCreatureMemoryCell,
          isObservedCell,
          isPlantMemoryCell,
          isTargetCell,
        })}
      </p>
      <p>Plants: {formatPlantList(plants)}</p>
      <p>
        Creatures:{" "}
        {creatures.length === 0
          ? "none"
          : creatures
              .map((entry) => `${entry.id}:${entry.kind}:${entry.energy}`)
              .join(", ")}
      </p>
      <div className="selectionActions">
        <button onClick={() => onAddSimpleAtCell(selectedCell)} type="button">
          Add simple here
        </button>
        <button onClick={() => onAddIntelAtCell(selectedCell)} type="button">
          Add intel here
        </button>
        <button onClick={() => onClearCellCreatures(selectedCell)} type="button">
          Clear creatures
        </button>
      </div>
      <div className="selectionActions">
        <button onClick={() => onAddPlantAtCell("green", selectedCell)} type="button">
          Green here
        </button>
        <button onClick={() => onAddPlantAtCell("red", selectedCell)} type="button">
          Red here
        </button>
        <button onClick={() => onAddPlantAtCell("yellow", selectedCell)} type="button">
          Yellow here
        </button>
        <button onClick={() => onAddPlantAtCell("magenta", selectedCell)} type="button">
          Magenta here
        </button>
        <button onClick={() => onClearCellPlants(selectedCell)} type="button">
          Clear plants
        </button>
      </div>
      {plants.length > 0 ? (
        <ul className="memoryList">
          {plants.map((plant) => (
            <li key={plant.id}>
              <div className="memoryListRow">
                <span>{`${plant.id}:${plant.type}:${plant.energy}`}</span>
                <span className="memoryActions">
                  <button onClick={() => onRemovePlant(plant.id)} type="button">
                    Remove
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {creatures.length > 0 ? (
        <ul className="memoryList">
          {creatures.map((entry) => (
            <li key={entry.id}>
              <div className="memoryListRow">
                <span>{`${entry.id}:${entry.kind}:${entry.energy}`}</span>
                <span className="memoryActions">
                  <button onClick={() => onSelectCreature(entry.id)} type="button">
                    Select
                  </button>
                  <button onClick={() => onRemoveCreature(entry.id)} type="button">
                    Remove
                  </button>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

interface DetailProps {
  icon: ReactNode;
  label: string;
  value: string | number;
}

function Detail({ icon, label, value }: DetailProps) {
  return (
    <div>
      <dt>
        {icon}
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
}

function MemoryList({
  entries,
  icon,
  onSelectCell,
  onSelectCreature,
  tick,
  title,
  world,
}: {
  entries: CreatureMemory[] | PlantMemory[];
  icon: ReactNode;
  onSelectCell: (position: Position | null) => void;
  onSelectCreature: (id: string | null) => void;
  tick: number;
  title: string;
  world: World;
}) {
  return (
    <section className="memoryBlock">
      <h3>
        {icon}
        {title}
      </h3>
      {entries.length === 0 ? (
        <p>None</p>
      ) : (
        <ul className="memoryList">
          {entries.slice(-5).reverse().map((entry) => {
            const liveCreature =
              "creatureId" in entry ? world.getCreature(entry.creatureId) : null;

            return (
              <li key={"plantId" in entry ? entry.plantId : entry.creatureId}>
                <div className="memoryListRow">
                  <span>
                    {"type" in entry ? entry.type : entry.kind} @
                    {" "}
                    {formatPosition(entry.position)}
                    {" "}
                    | seen {Math.max(0, tick - entry.lastSeenTick)} ticks ago | conf
                    {" "}
                    {entry.confidence.toFixed(2)}
                  </span>
                  <span className="memoryActions">
                    <button onClick={() => onSelectCell(entry.position)} type="button">
                      Pin
                    </button>
                    {"creatureId" in entry && liveCreature ? (
                      <button
                        onClick={() => {
                          onSelectCreature(entry.creatureId);
                          onSelectCell(liveCreature.position);
                        }}
                        type="button"
                      >
                        Select
                      </button>
                    ) : null}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function formatInventorySummary(creature: Creature): string {
  if (creature.inventory.length === 0) {
    return "empty";
  }

  const counts = new Map<string, number>();
  for (const plant of creature.inventory) {
    counts.set(plant.type, (counts.get(plant.type) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([type, count]) => `${type} ${count}`)
    .join(", ");
}

function formatInventoryDetail(creature: Creature): string {
  if (creature.inventory.length === 0) {
    return "No carried plants";
  }

  return creature.inventory.map((plant) => `${plant.id}:${plant.type}`).join(", ");
}

function formatPlantList(
  plants: Array<{ id: string; type: string; energy: number }>,
): string {
  if (plants.length === 0) {
    return "none";
  }

  return plants.map((plant) => `${plant.id}:${plant.type}:${plant.energy}`).join(", ");
}

function formatPosition(position: Position): string {
  return `${position.x}, ${position.y}`;
}

function formatLinkedCreature(creature: Creature | null): string {
  if (!creature) {
    return "none";
  }

  return `${creature.id} @ ${formatPosition(creature.position)}`;
}

function formatGroupMembers(creatures: Creature[]): string {
  if (creatures.length === 0) {
    return "none";
  }

  return creatures
    .map((creature) => `${creature.id} @ ${formatPosition(creature.position)}`)
    .join(" | ");
}

function formatCellFlags(flags: {
  isCreatureCell: boolean;
  isCreatureMemoryCell: boolean;
  isObservedCell: boolean;
  isPlantMemoryCell: boolean;
  isTargetCell: boolean;
}): string {
  const labels = [
    flags.isCreatureCell ? "selected creature" : null,
    flags.isObservedCell ? "visible" : null,
    flags.isTargetCell ? "target" : null,
    flags.isPlantMemoryCell ? "plant memory" : null,
    flags.isCreatureMemoryCell ? "creature memory" : null,
  ].filter((value): value is string => value !== null);

  return labels.length === 0 ? "none" : labels.join(", ");
}

function formatRelationshipRole(intel: IntelCreature | null): string {
  if (!intel) {
    return "solo";
  }
  if (intel.partnerId) {
    return "leader";
  }
  if (intel.leaderId) {
    return "partner";
  }
  return "solo";
}

function formatCommunicationMessage(message: CommunicationMessage): string {
  const payload = message.payload
    ? Object.entries(message.payload)
        .map(([key, value]) => `${key} ${value}`)
        .join(" | ")
    : "";
  return `t${message.tick} ${message.fromCreatureId} -> ${message.toCreatureId} ${message.type}${payload ? ` | ${payload}` : ""}`;
}

function formatStrategySummary(strategy: World["config"]["advanced"]["strategy"]): string {
  return [
    `coop ${strategy.cooperation.toFixed(1)}`,
    `explore ${strategy.exploration.toFixed(1)}`,
    `exploit ${strategy.exploitation.toFixed(1)}`,
    `risk ${strategy.riskAppetite.toFixed(1)}`,
    `memory ${strategy.memoryTrust.toFixed(1)}`,
    `reserve ${strategy.energyReserve.toFixed(1)}`,
  ].join(" | ");
}

function formatComboSummary(
  combo: ReturnType<typeof findBestCombo> | ReturnType<typeof findComboWithPlant>,
  plantType?: string,
): string {
  if (!combo) {
    return plantType ? `no carried match for ${plantType}` : "none";
  }

  const partner = plantType ? ` with ${plantType}` : "";
  return `${combo.combo}${partner} for ${combo.amount}`;
}

function describeTargetStatus({
  desiredPlant,
  desiredPlantId,
  memory,
  visibleCells,
}: {
  desiredPlant: ReturnType<World["getPlant"]>;
  desiredPlantId: string | null;
  memory: PlantMemory[];
  visibleCells: Position[];
}): string {
  if (!desiredPlantId) {
    return "none";
  }

  if (!desiredPlant) {
    return "missing from world";
  }

  const visible = visibleCells.some(
    (position) =>
      position.x === desiredPlant.position.x && position.y === desiredPlant.position.y,
  );
  const remembered = memory.some((entry) => entry.plantId === desiredPlant.id);

  if (visible) {
    return `${desiredPlant.type} visible now @ ${formatPosition(desiredPlant.position)}`;
  }

  if (remembered) {
    return `${desiredPlant.type} remembered @ ${formatPosition(desiredPlant.position)}`;
  }

  return `${desiredPlant.type} tracked @ ${formatPosition(desiredPlant.position)}`;
}

function formatVisibleCellFlags(cell: {
  isCurrent: boolean;
  isFacing: boolean;
  plants: Array<{ id: string }>;
  creatures: Creature[];
}): string {
  const flags = [
    cell.isCurrent ? "current" : null,
    cell.isFacing ? "ahead" : null,
    cell.plants.length > 0 ? "plants" : null,
    cell.creatures.length > 0 ? "occupied" : null,
  ].filter((value): value is string => value !== null);

  return flags.length === 0 ? "empty" : flags.join(", ");
}

function CreatureRoster({
  creatures,
  onSelectCreature,
  selectedCreatureId,
}: {
  creatures: Creature[];
  onSelectCreature: (id: string) => void;
  selectedCreatureId: string | null;
}) {
  return (
    <section className="memoryBlock">
      <div className="panelHeaderRow">
        <h3>Creature roster</h3>
        <span className="selectionCount">{creatures.length} alive</span>
      </div>
      {creatures.length === 0 ? (
        <p>None</p>
      ) : (
        <ul className="creatureRoster">
          {creatures.map((entry) => (
            <li key={entry.id}>
              <button
                className={entry.id === selectedCreatureId ? "rosterButton active" : "rosterButton"}
                onClick={() => onSelectCreature(entry.id)}
                type="button"
              >
                <span>{entry.id}</span>
                <span>{entry.kind}</span>
                <span>{formatPosition(entry.position)}</span>
                <span>{entry.energy}e</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
