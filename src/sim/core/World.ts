import {
  DEFAULT_CONFIG,
  createSimulationConfig,
  type DeepPartial,
  type SimulationConfig,
} from "../config/defaultConfig";
import { findBestCombo, findComboWithPlant, findSharedCombo, consumeCombo } from "../ai/combinations";
import { rememberCreature, rememberPlant } from "../ai/memory";
import { getSeasonState, type SeasonState } from "../ecology/seasons";
import { createTerrainCell } from "../ecology/terrain";
import {
  chooseWeightedIndex,
  flattenWeightedPositions,
} from "../ecology/weightedSpawn";
import type { CommunicationMessage, CommunicationMessageType } from "../communication/messages";
import { Grid } from "./Grid";
import { Creature } from "../entities/Creature";
import { IntelCreature } from "../entities/IntelCreature";
import { Plant, type SerializedPlant } from "../entities/Plant";
import { SimpleCreature } from "../entities/SimpleCreature";
import {
  DIRECTION_VECTORS,
  LEGACY_PLANT_TYPE_ORDER,
  MOVEMENT_DIRECTIONS,
  clonePosition,
  manhattanDistance,
  samePosition,
  type ComboType,
  type CreatureKind,
  type Direction,
  type PlantType,
  type Position,
  type SimulationMode,
} from "../entities/types";
import { SeededRandom } from "../random/SeededRandom";

const ADVANCED_DIRECTION_PRIORITY: Direction[] = [
  "north",
  "northEast",
  "east",
  "southEast",
  "south",
  "southWest",
  "west",
  "northWest",
];

export interface AddCreatureOptions {
  position?: Position;
  energy?: number;
  facing?: Direction;
}

export interface WorldStats {
  aliveCreatures: number;
  deadCreatures: number;
  simpleCreatures: number;
  intelCreatures: number;
  activePartnerships: number;
  totalPlants: number;
  plantCounts: Record<PlantType, number>;
  averageEnergy: number;
  averageFertility: number;
  season: SeasonState["name"];
  seasonProgress: number;
  tick: number;
}

export interface SerializedWorld {
  config: SimulationConfig;
  tick: number;
  rngState: number;
  nextPlantId: number;
  nextCreatureId: number;
  nextMessageId: number;
  deadCreatures: number;
  plants: SerializedPlant[];
  creatures: ReturnType<Creature["serialize"]>[];
  fertility: number[][];
  communicationLog: CommunicationMessage[];
}

export class World {
  config: SimulationConfig;
  readonly grid: Grid;
  readonly rng: SeededRandom;
  tick = 0;
  plants: Plant[] = [];
  creatures: Creature[] = [];
  deadCreatures = 0;
  communicationLog: CommunicationMessage[] = [];
  private nextPlantId = 1;
  private nextCreatureId = 1;
  private nextMessageId = 1;
  private fertility: number[][];

  constructor(config: DeepPartial<SimulationConfig> = {}) {
    this.config = createSimulationConfig(config);
    this.grid = new Grid(this.config.grid.width, this.config.grid.height);
    this.rng = new SeededRandom(this.config.seed);
    this.fertility = this.createFertilityMap();
    this.ensureTargetPlantPopulation();
  }

  static deserialize(snapshot: SerializedWorld): World {
    const world = new World({ ...snapshot.config, targetPlantPopulation: 0 });
    world.config = snapshot.config;
    world.tick = snapshot.tick;
    world.nextPlantId = snapshot.nextPlantId;
    world.nextCreatureId = snapshot.nextCreatureId;
    world.nextMessageId = snapshot.nextMessageId;
    world.deadCreatures = snapshot.deadCreatures;
    world.plants = snapshot.plants.map((plant) => new Plant(plant));
    world.creatures = snapshot.creatures.map((creature) => {
      const restored =
        creature.kind === "intel"
          ? new IntelCreature({
              id: creature.id,
              position: creature.position,
              energy: creature.energy,
              facing: creature.facing,
              alive: creature.alive,
            })
          : new SimpleCreature({
              id: creature.id,
              position: creature.position,
              energy: creature.energy,
              facing: creature.facing,
              alive: creature.alive,
            });

      restored.previousPosition = clonePosition(creature.previousPosition);
      restored.mode = creature.mode;
      restored.inventory = creature.inventory.map((plant) => new Plant(plant));

      if (restored instanceof IntelCreature && "plantMemory" in creature) {
        const intelSnapshot = creature as ReturnType<IntelCreature["serialize"]>;
        restored.plantMemory = intelSnapshot.plantMemory.map((entry) => ({
          ...entry,
          position: clonePosition(entry.position),
        }));
        restored.creatureMemory = intelSnapshot.creatureMemory.map((entry) => ({
          ...entry,
          position: clonePosition(entry.position),
        }));
        restored.desiredPlantId = intelSnapshot.desiredPlantId;
        restored.desiredCombo = intelSnapshot.desiredCombo;
        restored.partnerId = intelSnapshot.partnerId;
        restored.leaderId = intelSnapshot.leaderId;
        restored.requestedPlantId = intelSnapshot.requestedPlantId;
        restored.groupId = intelSnapshot.groupId;
        restored.groupMemberIds = [...(intelSnapshot.groupMemberIds ?? [])];
      }

      return restored;
    });
    world.fertility = snapshot.fertility.map((row) => [...row]);
    world.communicationLog = snapshot.communicationLog.map((message) => ({
      ...message,
      payload: message.payload ? { ...message.payload } : undefined,
    }));
    Object.assign(world.rng, SeededRandom.fromState(snapshot.rngState));
    return world;
  }

  setMode(mode: SimulationMode): void {
    this.config = { ...this.config, mode };
  }

  setConfig(config: SimulationConfig): void {
    const previousTerrainEnabled = this.config.advanced.terrainEnabled;
    this.config = createSimulationConfig(config);
    if (previousTerrainEnabled !== this.config.advanced.terrainEnabled) {
      this.fertility = this.createFertilityMap();
    }
  }

  reset(config: DeepPartial<SimulationConfig> = {}): void {
    const next = new World(createSimulationConfig({ ...this.config, ...config }));
    this.config = next.config;
    this.plants = next.plants;
    this.creatures = next.creatures;
    this.tick = next.tick;
    this.deadCreatures = next.deadCreatures;
    this.nextPlantId = next.nextPlantId;
    this.nextCreatureId = next.nextCreatureId;
    this.fertility = next.fertility;
  }

  clearWorld(): void {
    this.plants = [];
    this.creatures = [];
    this.deadCreatures = 0;
    this.nextCreatureId = 1;
    this.communicationLog = [];
    this.nextMessageId = 1;
  }

  clearPlants(): void {
    this.plants = [];
  }

  addCreature(kind: CreatureKind, options: AddCreatureOptions = {}): Creature {
    const position = this.grid.clamp(
      options.position ?? {
        x: this.rng.int(this.grid.width),
        y: this.rng.int(this.grid.height),
      },
    );
    const args = {
      id: `c${this.nextCreatureId++}`,
      position,
      energy: options.energy ?? this.config.initialCreatureEnergy,
      facing: options.facing,
    };
    const creature =
      kind === "intel" ? new IntelCreature(args) : new SimpleCreature(args);
    this.creatures.push(creature);
    return creature;
  }

  syncCreaturePopulation(kind: CreatureKind, target: number): void {
    const desired = Math.max(0, Math.floor(target));
    const alive = this.aliveCreatures().filter((creature) => creature.kind === kind);

    if (alive.length < desired) {
      for (let i = alive.length; i < desired; i += 1) {
        this.addCreature(kind);
      }
      return;
    }

    if (alive.length > desired) {
      for (let i = 0; i < alive.length - desired; i += 1) {
        const creature = alive[i];
        if (creature.alive) {
          creature.kill();
          this.deadCreatures += 1;
        }
      }
    }
  }

  addPlant(type?: PlantType, position?: Position): Plant {
    const plantType = type ?? this.randomPlantType();
    const energy =
      this.config.mode === "advanced"
        ? Math.round(
            this.config.plantEnergy[plantType] *
              this.getSeasonState().energyMultiplier,
          )
        : this.config.plantEnergy[plantType];
    const plant = new Plant({
      id: `p${this.nextPlantId++}`,
      type: plantType,
      energy,
      position: this.grid.clamp(
        position ?? {
          x: this.rng.int(this.grid.width),
          y: this.rng.int(this.grid.height),
        },
      ),
    });
    this.plants.push(plant);
    return plant;
  }

  createDetachedPlant(type: PlantType, position: Position = { x: 0, y: 0 }): Plant {
    return new Plant({
      id: `p${this.nextPlantId++}`,
      type,
      energy: this.config.plantEnergy[type],
      position: this.grid.clamp(position),
      taken: true,
    });
  }

  removePlant(id: string): Plant | null {
    const index = this.plants.findIndex((plant) => plant.id === id);
    if (index === -1) {
      return null;
    }
    return this.plants.splice(index, 1)[0];
  }

  getPlant(id: string | null): Plant | null {
    if (!id) {
      return null;
    }
    return this.plants.find((plant) => plant.id === id) ?? null;
  }

  getCreature(id: string | null): Creature | null {
    if (!id) {
      return null;
    }
    return this.creatures.find((creature) => creature.id === id) ?? null;
  }

  step(deltaTicks = 1): void {
    for (let i = 0; i < deltaTicks; i += 1) {
      this.stepOne();
    }
  }

  getStats(): WorldStats {
    const alive = this.creatures.filter((creature) => creature.alive);
    const totalEnergy = alive.reduce((sum, creature) => sum + creature.energy, 0);
    const simpleCreatures = alive.filter((creature) => creature.kind === "simple").length;
    const intelCreatures = alive.filter((creature) => creature.kind === "intel").length;
    const activePartnerships = alive.filter(
      (creature) =>
        creature instanceof IntelCreature &&
        (creature.partnerId !== null || creature.groupMemberIds.length > 0),
    ).length;
    const plantCounts: Record<PlantType, number> = {
      green: 0,
      red: 0,
      yellow: 0,
      magenta: 0,
    };
    for (const plant of this.plants) {
      plantCounts[plant.type] += 1;
    }
    const season = this.getSeasonState();
    return {
      aliveCreatures: alive.length,
      deadCreatures: this.deadCreatures,
      simpleCreatures,
      intelCreatures,
      activePartnerships,
      totalPlants: this.plants.length,
      plantCounts,
      averageEnergy: alive.length > 0 ? totalEnergy / alive.length : 0,
      averageFertility: this.getAverageFertility(),
      season: season.name,
      seasonProgress: season.progress,
      tick: this.tick,
    };
  }

  getFertility(position: Position): number {
    if (!this.grid.contains(position)) {
      return 0;
    }
    return this.fertility[position.y][position.x] ?? 0;
  }

  serialize(): SerializedWorld {
    return {
      config: this.config,
      tick: this.tick,
      rngState: this.rng.getState(),
      nextPlantId: this.nextPlantId,
      nextCreatureId: this.nextCreatureId,
      nextMessageId: this.nextMessageId,
      deadCreatures: this.deadCreatures,
      plants: this.plants.map((plant) => plant.serialize()),
      creatures: this.creatures.map((creature) => creature.serialize()),
      fertility: this.fertility.map((row) => [...row]),
      communicationLog: this.communicationLog.map((message) => ({
        ...message,
        payload: message.payload ? { ...message.payload } : undefined,
      })),
    };
  }

  getSeasonState(): SeasonState {
    return getSeasonState(this.tick, this.config.advanced.seasonalCycleLength);
  }

  getCommunicationMessages(options: {
    creatureId?: string | null;
    limit?: number;
  } = {}): CommunicationMessage[] {
    const { creatureId = null, limit = 12 } = options;
    const matching = creatureId
      ? this.communicationLog.filter(
          (message) =>
            message.fromCreatureId === creatureId || message.toCreatureId === creatureId,
        )
      : this.communicationLog;
    return matching.slice(-Math.max(0, limit));
  }

  private stepOne(): void {
    this.tick += 1;
    this.applyAdvancedEnvironment();
    this.ensureTargetPlantPopulation();

    const actors = this.aliveCreatures();

    for (const creature of actors) {
      if (creature instanceof IntelCreature) {
        this.pruneIntelMemory(creature, true);
        this.observeIntel(creature);
        this.updateIntelModeAndTarget(creature);
      }
      this.collectPlantsAtCreature(creature);
    }

    this.handleIntelCommunication();
    this.resolvePartnerships();

    for (const creature of actors) {
      this.eatIfHungry(creature);
    }

    const moved = new Map<string, boolean>();

    for (const creature of actors) {
      if (!creature.alive) {
        continue;
      }
      if (creature instanceof IntelCreature && creature.leaderId) {
        continue;
      }

      const direction = this.chooseMove(creature);
      const before = clonePosition(creature.position);
      this.applyMove(creature, direction);
      moved.set(creature.id, !samePosition(before, creature.position));

      if (creature instanceof IntelCreature && creature.partnerId) {
        this.moveGroupFollowers(creature, before, moved);
      }
    }

    for (const creature of actors) {
      if (!creature.alive) {
        continue;
      }
      this.collectPlantsAtCreature(creature);
      if (creature instanceof IntelCreature) {
        this.pruneIntelMemory(creature, false);
        this.observeIntel(creature);
        this.updateIntelModeAndTarget(creature);
      }
    }

    this.resolvePartnerships();

    for (const creature of actors) {
      this.eatIfHungry(creature);
      this.drainEnergy(creature, moved.get(creature.id) ?? false);
      if (creature.energy <= 0 && creature.alive) {
        creature.kill();
        this.deadCreatures += 1;
      }
    }

    this.cleanupRelationships();
    this.ensureTargetPlantPopulation();
  }

  private aliveCreatures(): Creature[] {
    return this.creatures
      .filter((creature) => creature.alive)
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  }

  private randomPlantType(): PlantType {
    if (this.config.mode === "advanced") {
      const enabledTypes = LEGACY_PLANT_TYPE_ORDER.slice(
        0,
        Math.max(1, Math.min(4, this.config.enabledPlantTypes)),
      );
      const season = this.getSeasonState();
      const weights = enabledTypes.map((type) => {
        const legacyWeight = type === "green" ? 2 : 1;
        return legacyWeight * season.plantWeights[type];
      });
      const selectedIndex = chooseWeightedIndex(this.rng.next(), weights);
      return enabledTypes[selectedIndex] ?? "green";
    }

    const enabled = Math.max(1, Math.min(4, this.config.enabledPlantTypes));
    let roll = this.rng.int(enabled + 1);
    if (roll === 0) {
      roll = 1;
    }
    return LEGACY_PLANT_TYPE_ORDER[roll - 1] ?? "green";
  }

  private ensureTargetPlantPopulation(): void {
    while (this.plants.length < this.config.targetPlantPopulation) {
      const missing = this.config.targetPlantPopulation - this.plants.length;
      this.addPlantSet(Math.min(missing, this.config.plantSetMaxSize));
    }
  }

  private addPlantSet(count: number): void {
    const cellPixels = this.config.grid.legacyCellPixels;
    const baseCell = this.choosePlantSetBaseCell();
    const baseX = baseCell.x * cellPixels + this.rng.int(cellPixels);
    const baseY = baseCell.y * cellPixels + this.rng.int(cellPixels);

    for (let i = 0; i < count; i += 1) {
      const offset = 20 + i * 10;
      const position = this.grid.clamp({
        x: Math.floor((baseX + offset) / cellPixels),
        y: Math.floor((baseY + offset) / cellPixels),
      });
      this.addPlant(this.randomPlantType(), position);
    }
  }

  private collectPlantsAtCreature(creature: Creature): void {
    const limit =
      creature instanceof IntelCreature
        ? this.config.intel.maxInventory
        : this.config.simple.maxInventory;

    for (const plant of [...this.plants]) {
      if (!creature.hasInventorySpace(limit)) {
        return;
      }
      if (!samePosition(plant.position, creature.position)) {
        continue;
      }
      if (
        creature instanceof IntelCreature &&
        creature.leaderId &&
        creature.requestedPlantId === plant.id
      ) {
        continue;
      }

      this.removePlant(plant.id);
      creature.receivePlant(plant);
      this.depleteFertility(plant.position);
    }
  }

  private observeIntel(creature: IntelCreature): void {
    const visiblePositions = this.grid.ahead(
      creature.position,
      creature.facing,
      this.config.intel.observationRange,
    );

    for (const plant of this.plants) {
      if (visiblePositions.some((position) => samePosition(position, plant.position))) {
        rememberPlant(
          creature.plantMemory,
          {
            plantId: plant.id,
            type: plant.type,
            position: plant.position,
            lastSeenTick: this.tick,
            confidence: 1,
          },
          this.config.intel.plantMemory,
        );
      }
    }

    for (const other of this.creatures) {
      if (
        other.id !== creature.id &&
        other.alive &&
        visiblePositions.some((position) => samePosition(position, other.position))
      ) {
        rememberCreature(
          creature.creatureMemory,
          {
            creatureId: other.id,
            kind: other.kind,
            position: other.position,
            lastSeenTick: this.tick,
            confidence: 1,
          },
          this.config.intel.creatureMemory,
        );
      }
    }
  }

  private pruneIntelMemory(
    creature: IntelCreature,
    decayAdvancedMemory: boolean,
  ): void {
    if (this.config.mode === "advanced") {
      if (decayAdvancedMemory) {
        for (const entry of creature.plantMemory) {
          entry.confidence = Math.max(
            0,
            entry.confidence - this.config.advanced.memoryDecayPerTick,
          );
        }
        creature.plantMemory = creature.plantMemory.filter(
          (entry) => entry.confidence > 0,
        );
        for (const entry of creature.creatureMemory) {
          entry.confidence = Math.max(
            0,
            entry.confidence - this.config.advanced.memoryDecayPerTick,
          );
        }
        creature.creatureMemory = creature.creatureMemory.filter(
          (entry) => entry.confidence > 0,
        );
      }
      return;
    }

    const livePlantIds = new Set(this.plants.map((plant) => plant.id));
    for (const carried of creature.inventory) {
      livePlantIds.add(carried.id);
    }
    creature.plantMemory = creature.plantMemory.filter((entry) =>
      livePlantIds.has(entry.plantId),
    );
  }

  private updateIntelModeAndTarget(creature: IntelCreature): void {
    if (!creature.alive) {
      creature.mode = "dead";
      return;
    }
    if (creature.leaderId) {
      creature.mode = "partnered";
      return;
    }
    if (creature.groupMemberIds.length > 0) {
      creature.mode = "leading";
      return;
    }
    if (creature.inventory.length === 0 && creature.plantMemory.length === 0) {
      creature.mode = "observing";
      creature.desiredPlantId = null;
      creature.desiredCombo = null;
      return;
    }
    if (creature.mode === "observing" && creature.plantMemory.length <= 1) {
      creature.desiredPlantId = null;
      creature.desiredCombo = null;
      return;
    }

    const target = this.selectDesiredPlant(creature);
    if (target) {
      creature.desiredPlantId = target.plant.id;
      creature.desiredCombo = target.combo;
      creature.mode = "pursuing";
    } else {
      creature.desiredPlantId = null;
      creature.desiredCombo = null;
      creature.mode = creature.plantMemory.length > 0 ? "pursuing" : "observing";
    }
  }

  private selectDesiredPlant(
    creature: IntelCreature,
  ): { plant: Plant; combo: ComboType | null } | null {
    const rememberedPlants = creature.plantMemory
      .map((entry) => ({
        plant: this.getPlant(entry.plantId),
        confidence: entry.confidence,
        lastSeenTick: entry.lastSeenTick,
      }))
      .filter(
        (
          entry,
        ): entry is {
          plant: Plant;
          confidence: number;
          lastSeenTick: number;
        } => entry.plant !== null,
      );

    if (rememberedPlants.length === 0) {
      return null;
    }

    if (this.config.mode === "advanced") {
      return this.selectAdvancedDesiredPlant(creature, rememberedPlants);
    }

    const comboTargets: Array<{
      plant: Plant;
      match: NonNullable<ReturnType<typeof findComboWithPlant>>;
    }> = [];

    for (const { plant } of rememberedPlants) {
      const match = findComboWithPlant(creature.inventory, plant.type, this.config);
      if (match) {
        comboTargets.push({ plant, match });
      }
    }

    comboTargets.sort((a, b) => {
      if (b.match.amount !== a.match.amount) {
        return b.match.amount - a.match.amount;
      }
      return (
        manhattanDistance(creature.position, a.plant.position) -
        manhattanDistance(creature.position, b.plant.position)
      );
    });

    if (comboTargets[0]) {
      return { plant: comboTargets[0].plant, combo: comboTargets[0].match.combo };
    }

    const latest = rememberedPlants[rememberedPlants.length - 1];
    return { plant: latest.plant, combo: null };
  }

  private handleIntelCommunication(): void {
    if (!this.config.intel.communicationEnabled) {
      return;
    }

    const intelCreatures = this.aliveCreatures().filter(
      (creature): creature is IntelCreature => creature instanceof IntelCreature,
    );

    for (let i = 0; i < intelCreatures.length; i += 1) {
      for (let j = i + 1; j < intelCreatures.length; j += 1) {
        const left = intelCreatures[i];
        const right = intelCreatures[j];
        if (!samePosition(left.position, right.position)) {
          continue;
        }
        if (this.trySharedCombination(left, right)) {
          continue;
        }
        this.tryCreatePartnership(left, right);
        this.tryCreatePartnership(right, left);
      }
    }
  }

  private trySharedCombination(left: IntelCreature, right: IntelCreature): boolean {
    if (left.isLeader || left.isPartner || right.isLeader || right.isPartner) {
      return false;
    }

    const match = findSharedCombo(left.inventory, right.inventory, this.config);
    if (!match) {
      return false;
    }

    this.recordCommunication(left.id, right.id, "askInventory");
    this.recordCommunication(left.id, right.id, "proposeShare", {
      combo: match.combo,
      amount: match.amount,
      leftPlantId: match.plantIds[0],
      rightPlantId: match.plantIds[1],
    });
    this.recordCommunication(right.id, left.id, "acceptShare", {
      combo: match.combo,
      amount: match.amount * 2,
    });
    left.removeInventoryPlantById(match.plantIds[0]);
    right.removeInventoryPlantById(match.plantIds[1]);
    const sharedAmount = match.amount * 2;
    left.energy += sharedAmount;
    right.energy += sharedAmount;
    return true;
  }

  private tryCreatePartnership(leader: IntelCreature, candidate: IntelCreature): boolean {
    const classicRelationshipBlocked =
      this.config.mode !== "advanced" &&
      (leader.isLeader || leader.isPartner || candidate.isLeader || candidate.isPartner);
    if (classicRelationshipBlocked || leader.isPartner || candidate.isLeader || candidate.isPartner) {
      return false;
    }

    if (this.config.mode === "advanced" && leader.isLeader && !this.canAddGroupMember(leader)) {
      return false;
    }

    const target = this.getPlant(leader.desiredPlantId);
    if (!target || !leader.desiredCombo) {
      return false;
    }

    const candidateCombo = findComboWithPlant(
      candidate.inventory,
      target.type,
      this.config,
    );
    const cooperation = this.config.advanced.strategy.cooperation;
    const partnershipThreshold =
      this.config.mode === "advanced"
        ? this.config.intel.partnershipMinComboEnergy *
          this.clamp(1.3 - cooperation * 0.3, 0.7, 1.3)
        : this.config.intel.partnershipMinComboEnergy;
    if (
      !candidateCombo ||
      candidateCombo.combo !== leader.desiredCombo ||
      candidateCombo.amount < partnershipThreshold
    ) {
      return false;
    }

    this.recordCommunication(leader.id, candidate.id, "requestPartnership", {
      combo: leader.desiredCombo,
      plantId: target.id,
      amount: candidateCombo.amount,
    });
    const groupId = leader.groupId ?? `group-${leader.id}-${candidate.id}`;
    leader.groupId = groupId;
    leader.groupMemberIds = [...leader.groupMemberIds, candidate.id];
    leader.partnerId = leader.groupMemberIds[0] ?? candidate.id;
    leader.mode = "leading";
    candidate.leaderId = leader.id;
    candidate.requestedPlantId = target.id;
    candidate.mode = "partnered";
    candidate.groupId = groupId;
    this.recordCommunication(candidate.id, leader.id, "acceptPartnership", {
      combo: leader.desiredCombo,
      plantId: target.id,
      groupId,
    });
    if (this.config.mode === "advanced") {
      this.recordCommunication(leader.id, candidate.id, "joinGroup", {
        groupId,
        size: leader.groupMemberIds.length + 1,
      });
    }
    return true;
  }

  private resolvePartnerships(): void {
    const leaders = this.aliveCreatures().filter(
      (creature): creature is IntelCreature =>
        creature instanceof IntelCreature &&
        this.getGroupMemberIds(creature).length > 0,
    );

    for (const leader of leaders) {
      const members = this.getGroupMembers(leader);
      if (members.length !== this.getGroupMemberIds(leader).length) {
        this.endPartnership(leader);
        continue;
      }

      if (!leader.desiredPlantId || !leader.desiredCombo) {
        this.endPartnership(leader, members);
        continue;
      }

      const targetInWorld = this.getPlant(leader.desiredPlantId);
      const targetInInventory = leader.inventory.some(
        (plant) => plant.id === leader.desiredPlantId,
      );

      if (!targetInWorld && !targetInInventory) {
        this.endPartnership(leader, members);
        continue;
      }

      const match = findBestCombo(leader.inventory, this.config, leader.desiredPlantId);
      if (match && match.combo === leader.desiredCombo) {
        consumeCombo(leader.inventory, match);
        const reward = match.amount * 2;
        leader.energy += reward;
        for (const member of members) {
          member.energy += reward;
        }
        this.endPartnership(leader, members);
      }
    }
  }

  private endPartnership(
    leader: IntelCreature,
    members: IntelCreature[] = this.getGroupMembers(leader),
  ): void {
    const groupId = leader.groupId ?? members[0]?.groupId ?? null;
    const memberIds = this.getGroupMemberIds(leader);
    leader.partnerId = null;
    leader.desiredPlantId = null;
    leader.desiredCombo = null;
    leader.groupId = null;
    leader.groupMemberIds = [];
    if (leader.alive) {
      leader.mode = leader.plantMemory.length > 0 ? "pursuing" : "observing";
    }

    for (const member of members) {
      member.leaderId = null;
      member.requestedPlantId = null;
      member.groupId = null;
      if (member.alive) {
        member.mode = member.plantMemory.length > 0 ? "pursuing" : "observing";
      }
    }

    if (groupId && this.config.mode === "advanced") {
      for (const memberId of memberIds) {
        this.recordCommunication(leader.id, memberId, "leaveGroup", { groupId });
      }
    }
  }

  private eatIfHungry(creature: Creature): void {
    if (!creature.alive || creature.energy >= this.config.hungerThreshold) {
      return;
    }

    const combo = findBestCombo(creature.inventory, this.config);
    if (combo) {
      consumeCombo(creature.inventory, combo);
      creature.energy += combo.amount;
      return;
    }

    const protectedPlantId =
      creature instanceof IntelCreature && creature.leaderId
        ? creature.requestedPlantId
        : null;
    const edibleIndex = creature.inventory.findIndex(
      (plant) => plant.id !== protectedPlantId,
    );
    if (edibleIndex !== -1) {
      const [plant] = creature.inventory.splice(edibleIndex, 1);
      creature.energy += plant.energy;
    }
  }

  private chooseMove(creature: Creature): Direction {
    const override = creature.consumeNextMoveOverride();
    if (override) {
      return override;
    }

    if (creature instanceof IntelCreature) {
      if (creature.leaderId) {
        return "stay";
      }
      if (creature.inventory.length >= this.config.intel.maxInventory) {
        return "stay";
      }
      const target = this.getPlant(creature.desiredPlantId);
      if (target) {
        if (this.config.mode === "advanced") {
          return this.findAdvancedDirection(creature.position, target.position);
        }
        return this.directionToward(creature.position, target.position);
      }
    }

    return this.rng.choice(MOVEMENT_DIRECTIONS);
  }

  private directionToward(from: Position, to: Position): Direction {
    const dx = Math.sign(to.x - from.x);
    const dy = Math.sign(to.y - from.y);
    const match = Object.values(DIRECTION_VECTORS).find(
      (vector) => vector.dx === dx && vector.dy === dy,
    );
    return match?.direction ?? "stay";
  }

  private selectAdvancedDesiredPlant(
    creature: IntelCreature,
    rememberedPlants: Array<{
      plant: Plant;
      confidence: number;
      lastSeenTick: number;
    }>,
  ): { plant: Plant; combo: ComboType | null } | null {
    const strategy = this.config.advanced.strategy;
    const rankedPlants = rememberedPlants
      .map((entry) => {
        const match = findComboWithPlant(
          creature.inventory,
          entry.plant.type,
          this.config,
        );
        const travelCost = this.estimateAdvancedTravelCost(
          creature.position,
          entry.plant.position,
        );
        const rewardScore =
          (match === null ? entry.plant.energy : match.amount) *
          strategy.exploitation;
        const comboScore = match ? 60 * strategy.exploitation : 0;
        const explorationScore = match ? 0 : 90 * strategy.exploration;
        const memoryScore = entry.confidence * 40 * strategy.memoryTrust;
        const fertilityScore =
          this.getFertility(entry.plant.position) * 12 * strategy.riskAppetite;
        const travelPenalty = travelCost * (18 - strategy.riskAppetite * 6);
        const movementBudget = Math.max(
          1,
          creature.energy / Math.max(1, this.config.intel.movementCost),
        );
        const reservePenalty =
          Math.max(0, travelCost - movementBudget) *
          12 *
          strategy.energyReserve;
        const score =
          rewardScore +
          comboScore +
          explorationScore +
          memoryScore +
          fertilityScore -
          travelPenalty -
          reservePenalty;
        return {
          combo: match?.combo ?? null,
          lastSeenTick: entry.lastSeenTick,
          plant: entry.plant,
          score,
          travelCost,
        };
      })
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        if (left.travelCost !== right.travelCost) {
          return left.travelCost - right.travelCost;
        }
        if (right.lastSeenTick !== left.lastSeenTick) {
          return right.lastSeenTick - left.lastSeenTick;
        }
        return left.plant.id.localeCompare(right.plant.id);
      });

    const best = rankedPlants[0];
    if (!best) {
      return null;
    }

    return { plant: best.plant, combo: best.combo };
  }

  private findAdvancedDirection(from: Position, to: Position): Direction {
    const startKey = this.positionKey(from);
    const frontier: Array<{ key: string; position: Position; priority: number }> = [
      { key: startKey, position: clonePosition(from), priority: 0 },
    ];
    const cameFrom = new Map<string, string | null>([[startKey, null]]);
    const costs = new Map<string, number>([[startKey, 0]]);

    while (frontier.length > 0) {
      frontier.sort((left, right) => left.priority - right.priority);
      const current = frontier.shift();
      if (!current) {
        break;
      }
      if (samePosition(current.position, to)) {
        break;
      }

      for (const direction of ADVANCED_DIRECTION_PRIORITY) {
        const next = this.grid.move(current.position, direction);
        if (samePosition(next, current.position)) {
          continue;
        }

        const nextKey = this.positionKey(next);
        const nextCost =
          (costs.get(current.key) ?? 0) + this.advancedStepCost(next);
        if (nextCost >= (costs.get(nextKey) ?? Number.POSITIVE_INFINITY)) {
          continue;
        }

        costs.set(nextKey, nextCost);
        cameFrom.set(nextKey, current.key);
        frontier.push({
          key: nextKey,
          position: next,
          priority: nextCost + this.chebyshevDistance(next, to),
        });
      }
    }

    const targetKey = this.positionKey(to);
    if (!cameFrom.has(targetKey)) {
      return this.directionToward(from, to);
    }

    let cursorKey = targetKey;
    let previousKey = cameFrom.get(cursorKey) ?? null;

    while (previousKey !== null && previousKey !== startKey) {
      cursorKey = previousKey;
      previousKey = cameFrom.get(cursorKey) ?? null;
    }

    const nextStep = this.positionFromKey(cursorKey);
    return this.directionToward(from, nextStep);
  }

  private estimateAdvancedTravelCost(from: Position, to: Position): number {
    if (samePosition(from, to)) {
      return 0;
    }

    const firstStep = this.findAdvancedDirection(from, to);
    if (firstStep === "stay") {
      return this.chebyshevDistance(from, to);
    }

    let cursor = clonePosition(from);
    let total = 0;
    let guard = this.grid.width * this.grid.height;

    while (!samePosition(cursor, to) && guard > 0) {
      const direction = this.findAdvancedDirection(cursor, to);
      if (direction === "stay") {
        total += this.chebyshevDistance(cursor, to);
        break;
      }
      cursor = this.grid.move(cursor, direction);
      total += this.advancedStepCost(cursor);
      guard -= 1;
    }

    return total;
  }

  private advancedStepCost(position: Position): number {
    const fertility = this.getFertility(position);
    return 1 + (1.5 - fertility) * 2;
  }

  private chebyshevDistance(from: Position, to: Position): number {
    return Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  }

  private positionKey(position: Position): string {
    return `${position.x},${position.y}`;
  }

  private positionFromKey(key: string): Position {
    const [x, y] = key.split(",").map(Number);
    return { x, y };
  }

  private applyMove(creature: Creature, direction: Direction): void {
    creature.previousPosition = clonePosition(creature.position);
    if (direction !== "stay") {
      creature.facing = direction;
    }
    creature.position = this.grid.move(creature.position, direction);
  }

  private drainEnergy(creature: Creature, moved: boolean): void {
    if (!creature.alive) {
      return;
    }
    const costs =
      creature instanceof IntelCreature ? this.config.intel : this.config.simple;
    creature.energy -= moved ? costs.movementCost : costs.stayCost;
  }

  private cleanupRelationships(): void {
    for (const creature of this.creatures) {
      if (!(creature instanceof IntelCreature)) {
        continue;
      }
      if (creature.partnerId) {
        const members = this.getGroupMembers(creature);
        if (members.length !== creature.groupMemberIds.length) {
          this.endPartnership(creature);
        }
      }
      if (creature.leaderId) {
        const leader = this.getCreature(creature.leaderId);
        if (!(leader instanceof IntelCreature) || !leader.alive) {
          creature.clearRelationship();
        }
      }
    }
  }

  private createFertilityMap(): number[][] {
    if (!this.config.advanced.terrainEnabled) {
      return Array.from({ length: this.grid.height }, () =>
        Array.from({ length: this.grid.width }, () => 1),
      );
    }

    return Array.from({ length: this.grid.height }, (_, y) =>
      Array.from({ length: this.grid.width }, (_, x) =>
        createTerrainCell(
          this.config.seed,
          { x, y },
          this.grid.width,
          this.grid.height,
        ).fertility,
      ),
    );
  }

  private applyAdvancedEnvironment(): void {
    if (this.config.mode !== "advanced") {
      return;
    }

    for (let y = 0; y < this.fertility.length; y += 1) {
      for (let x = 0; x < this.fertility[y].length; x += 1) {
        this.fertility[y][x] = Math.min(
          1.5,
          this.fertility[y][x] + this.config.advanced.fertilityRegrowthRate,
        );
      }
    }
  }

  private depleteFertility(position: Position): void {
    if (this.config.mode !== "advanced") {
      return;
    }
    this.fertility[position.y][position.x] = Math.max(
      0.2,
      this.fertility[position.y][position.x] - 0.1,
    );
  }

  private choosePlantSetBaseCell(): Position {
    if (this.config.mode !== "advanced" || !this.config.advanced.terrainEnabled) {
      return {
        x: this.rng.int(this.grid.width),
        y: this.rng.int(this.grid.height),
      };
    }

    const weightedPositions = flattenWeightedPositions(this.fertility);
    const index = chooseWeightedIndex(
      this.rng.next(),
      weightedPositions.map((entry) => entry.weight),
    );

    return weightedPositions[index]?.position ?? { x: 0, y: 0 };
  }

  private getAverageFertility(): number {
    const totalCells = this.grid.width * this.grid.height;
    if (totalCells === 0) {
      return 0;
    }

    let total = 0;
    for (const row of this.fertility) {
      for (const fertility of row) {
        total += fertility;
      }
    }

    return total / totalCells;
  }

  private recordCommunication(
    fromCreatureId: string,
    toCreatureId: string,
    type: CommunicationMessageType,
    payload?: Record<string, string | number | boolean | null>,
  ): void {
    this.communicationLog.push({
      id: `msg-${this.nextMessageId++}`,
      tick: this.tick,
      fromCreatureId,
      toCreatureId,
      type,
      payload,
    });
    if (this.communicationLog.length > 120) {
      this.communicationLog.splice(0, this.communicationLog.length - 120);
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private moveGroupFollowers(
    leader: IntelCreature,
    leaderPreviousPosition: Position,
    moved: Map<string, boolean>,
  ): void {
    let previousPosition = clonePosition(leaderPreviousPosition);
    for (const member of this.getGroupMembers(leader)) {
      const before = clonePosition(member.position);
      member.previousPosition = before;
      member.position = this.grid.clamp(previousPosition);
      member.facing = leader.facing;
      moved.set(member.id, !samePosition(before, member.position));
      previousPosition = before;
    }
  }

  private getGroupMembers(leader: IntelCreature): IntelCreature[] {
    return this.getGroupMemberIds(leader)
      .map((memberId) => this.getCreature(memberId))
      .filter(
        (member): member is IntelCreature =>
          member instanceof IntelCreature && member.alive && member.leaderId === leader.id,
      );
  }

  private getGroupMemberIds(leader: IntelCreature): string[] {
    if (leader.groupMemberIds.length > 0) {
      return [...leader.groupMemberIds];
    }
    // Classic pair state predates Advanced Mode groups and may only carry partnerId.
    return leader.partnerId ? [leader.partnerId] : [];
  }

  private canAddGroupMember(leader: IntelCreature): boolean {
    return this.getGroupMemberIds(leader).length + 1 < Math.max(2, this.config.advanced.groupSizeLimit);
  }
}

export function createClassicWorld(
  overrides: DeepPartial<SimulationConfig> = {},
): World {
  return new World({ ...DEFAULT_CONFIG, ...overrides, mode: "classic" });
}
