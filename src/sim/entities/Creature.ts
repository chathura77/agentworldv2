import { Plant, type SerializedPlant } from "./Plant";
import {
  clonePosition,
  type CreatureKind,
  type CreatureMode,
  type Direction,
  type Position,
} from "./types";

export interface CreatureArgs {
  id: string;
  kind: CreatureKind;
  position: Position;
  energy: number;
  facing?: Direction;
  alive?: boolean;
}

export interface SerializedCreature {
  id: string;
  kind: CreatureKind;
  position: Position;
  previousPosition: Position;
  facing: Direction;
  energy: number;
  alive: boolean;
  mode: CreatureMode;
  inventory: SerializedPlant[];
}

export abstract class Creature {
  readonly id: string;
  readonly kind: CreatureKind;
  position: Position;
  previousPosition: Position;
  facing: Direction;
  energy: number;
  alive: boolean;
  mode: CreatureMode;
  inventory: Plant[] = [];
  private nextMoveOverride: Direction | null = null;

  protected constructor(args: CreatureArgs) {
    this.id = args.id;
    this.kind = args.kind;
    this.position = clonePosition(args.position);
    this.previousPosition = clonePosition(args.position);
    this.facing = args.facing ?? "east";
    this.energy = args.energy;
    this.alive = args.alive ?? true;
    this.mode = this.alive ? "wandering" : "dead";
  }

  setNextMove(direction: Direction): void {
    this.nextMoveOverride = direction;
  }

  consumeNextMoveOverride(): Direction | null {
    const direction = this.nextMoveOverride;
    this.nextMoveOverride = null;
    return direction;
  }

  hasInventorySpace(limit: number): boolean {
    return this.inventory.length < limit;
  }

  receivePlant(plant: Plant): void {
    plant.take();
    this.inventory.push(plant);
  }

  removeInventoryPlantById(id: string): Plant | null {
    const index = this.inventory.findIndex((plant) => plant.id === id);
    if (index === -1) {
      return null;
    }
    return this.inventory.splice(index, 1)[0];
  }

  kill(): void {
    this.alive = false;
    this.mode = "dead";
  }

  serialize(): SerializedCreature {
    return {
      id: this.id,
      kind: this.kind,
      position: clonePosition(this.position),
      previousPosition: clonePosition(this.previousPosition),
      facing: this.facing,
      energy: this.energy,
      alive: this.alive,
      mode: this.mode,
      inventory: this.inventory.map((plant) => plant.serialize()),
    };
  }
}

