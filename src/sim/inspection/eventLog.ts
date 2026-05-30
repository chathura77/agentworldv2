import type { SerializedWorld } from "../core/World";
import type { CommunicationMessage } from "../communication/messages";

export interface SimulationEvent {
  id: string;
  tick: number;
  summary: string;
}

export type SimulationAction =
  | "step"
  | "reset"
  | "toggle-mode"
  | "add-simple-creature"
  | "add-intel-creature"
  | "add-plants"
  | "clear-plants"
  | "clear-world"
  | "load-snapshot"
  | "update-settings";

export function summarizeWorldEvents(
  action: SimulationAction,
  before: SerializedWorld,
  after: SerializedWorld,
): string[] {
  const summaries: string[] = [];
  const tickDelta = after.tick - before.tick;
  const beforeAlive = new Map(
    before.creatures.filter((creature) => creature.alive).map((creature) => [creature.id, creature]),
  );
  const afterAlive = new Map(
    after.creatures.filter((creature) => creature.alive).map((creature) => [creature.id, creature]),
  );
  const spawned = Array.from(afterAlive.values()).filter(
    (creature) => !beforeAlive.has(creature.id),
  );
  const removed = Array.from(beforeAlive.values()).filter(
    (creature) => !afterAlive.has(creature.id),
  );

  if (tickDelta > 0) {
    summaries.push(`Advanced ${tickDelta} tick${tickDelta === 1 ? "" : "s"} to ${after.tick}.`);
  }

  if (before.config.mode !== after.config.mode) {
    summaries.push(`Switched to ${after.config.mode} mode without resetting the world.`);
  }

  const spawnedSimple = spawned.filter((creature) => creature.kind === "simple").length;
  const spawnedIntel = spawned.filter((creature) => creature.kind === "intel").length;
  if (spawnedSimple > 0) {
    summaries.push(`Spawned ${spawnedSimple} simple creature${spawnedSimple === 1 ? "" : "s"}.`);
  }
  if (spawnedIntel > 0) {
    summaries.push(`Spawned ${spawnedIntel} intel creature${spawnedIntel === 1 ? "" : "s"}.`);
  }

  const removedSimple = removed.filter((creature) => creature.kind === "simple").length;
  const removedIntel = removed.filter((creature) => creature.kind === "intel").length;
  if (removedSimple > 0) {
    summaries.push(`Removed ${removedSimple} simple creature${removedSimple === 1 ? "" : "s"}.`);
  }
  if (removedIntel > 0) {
    summaries.push(`Removed ${removedIntel} intel creature${removedIntel === 1 ? "" : "s"}.`);
  }

  const plantDelta = after.plants.length - before.plants.length;
  if (plantDelta > 0) {
    summaries.push(`Added ${plantDelta} plant${plantDelta === 1 ? "" : "s"}; total ${after.plants.length}.`);
  }
  if (plantDelta < 0) {
    const removedPlants = Math.abs(plantDelta);
    summaries.push(
      `Removed ${removedPlants} plant${removedPlants === 1 ? "" : "s"}; total ${after.plants.length}.`,
    );
  }

  const formedPairs = differenceInPairs(before, after);
  if (formedPairs > 0) {
    summaries.push(`Formed ${formedPairs} intel partnership${formedPairs === 1 ? "" : "s"}.`);
  }

  const clearedPairs = differenceInPairs(after, before);
  if (clearedPairs > 0) {
    summaries.push(`Ended ${clearedPairs} intel partnership${clearedPairs === 1 ? "" : "s"}.`);
  }

  for (const message of findNewMessages(before, after)) {
    summaries.push(summarizeCommunicationMessage(message));
  }

  if (action === "clear-world" && after.creatures.length === 0 && after.plants.length === 0) {
    summaries.unshift("Cleared all creatures and plants from the world.");
  }

  if (action === "clear-plants" && before.plants.length > 0 && after.plants.length === 0) {
    summaries.unshift("Cleared every plant from the world.");
  }

  if (action === "reset") {
    summaries.unshift(
      `Reset the world to a ${after.config.grid.width}x${after.config.grid.height} classic shell state.`,
    );
  }

  if (action === "load-snapshot") {
    summaries.unshift(`Loaded snapshot at tick ${after.tick} with ${after.plants.length} plants.`);
  }

  if (summaries.length === 0 && action === "update-settings") {
    summaries.push("Applied simulation settings to the current world state.");
  }

  return summaries;
}

export function createSimulationEvents(
  action: SimulationAction,
  before: SerializedWorld,
  after: SerializedWorld,
  nextId: number,
): { events: SimulationEvent[]; nextId: number } {
  const summaries = summarizeWorldEvents(action, before, after);
  const events = summaries.map((summary, index) => ({
    id: `event-${nextId + index}`,
    tick: after.tick,
    summary,
  }));

  return {
    events,
    nextId: nextId + events.length,
  };
}

function differenceInPairs(left: SerializedWorld, right: SerializedWorld): number {
  const leftPairs = partnershipKeys(left);
  const rightPairs = partnershipKeys(right);
  return Array.from(rightPairs).filter((key) => !leftPairs.has(key)).length;
}

function partnershipKeys(world: SerializedWorld): Set<string> {
  return new Set(
    world.creatures
      .filter((creature) => creature.kind === "intel" && "partnerId" in creature)
      .map((creature) => {
        const partnerId = "partnerId" in creature ? creature.partnerId : null;
        return partnerId ? `${creature.id}:${partnerId}` : null;
      })
      .filter((key): key is string => key !== null),
  );
}

function findNewMessages(
  before: SerializedWorld,
  after: SerializedWorld,
): CommunicationMessage[] {
  const seenIds = new Set(before.communicationLog.map((message) => message.id));
  return after.communicationLog.filter((message) => !seenIds.has(message.id));
}

function summarizeCommunicationMessage(message: CommunicationMessage): string {
  const combo = asString(message.payload?.combo);
  const amount = asNumber(message.payload?.amount);
  const plantId = asString(message.payload?.plantId);
  const groupId = asString(message.payload?.groupId);
  const size = asNumber(message.payload?.size);

  switch (message.type) {
    case "askInventory":
      return `${message.fromCreatureId} asked ${message.toCreatureId} to compare inventory.`;
    case "proposeShare":
      return `${message.fromCreatureId} proposed ${combo ?? "a"} share to ${message.toCreatureId}${amount !== null ? ` for ${amount} energy` : ""}.`;
    case "acceptShare":
      return `${message.fromCreatureId} accepted ${combo ?? "a"} share with ${message.toCreatureId}${amount !== null ? ` for ${amount} energy` : ""}.`;
    case "rejectShare":
      return `${message.fromCreatureId} rejected ${combo ?? "a"} share from ${message.toCreatureId}.`;
    case "requestPartnership":
      return `${message.fromCreatureId} requested ${combo ?? "a"} partnership with ${message.toCreatureId}${plantId ? ` around ${plantId}` : ""}.`;
    case "acceptPartnership":
      return `${message.fromCreatureId} accepted partnership with ${message.toCreatureId}${groupId ? ` in ${groupId}` : ""}.`;
    case "rejectPartnership":
      return `${message.fromCreatureId} rejected partnership with ${message.toCreatureId}.`;
    case "joinGroup":
      return `${message.fromCreatureId} formed ${groupId ?? "a group"} with ${message.toCreatureId}${size !== null ? ` (${size} members)` : ""}.`;
    case "leaveGroup":
      return `${message.fromCreatureId} ended ${groupId ?? "the group"} with ${message.toCreatureId}.`;
    default:
      return `${message.fromCreatureId} sent ${message.type} to ${message.toCreatureId}.`;
  }
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}
