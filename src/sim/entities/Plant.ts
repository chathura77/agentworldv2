import { clonePosition, type PlantType, type Position } from "./types";

export interface PlantArgs {
  id: string;
  type: PlantType;
  energy: number;
  position: Position;
  taken?: boolean;
}

export interface SerializedPlant {
  id: string;
  type: PlantType;
  energy: number;
  position: Position;
  taken: boolean;
}

export class Plant {
  readonly id: string;
  readonly type: PlantType;
  readonly energy: number;
  position: Position;
  taken: boolean;

  constructor(args: PlantArgs) {
    this.id = args.id;
    this.type = args.type;
    this.energy = args.energy;
    this.position = clonePosition(args.position);
    this.taken = args.taken ?? false;
  }

  take(): void {
    this.taken = true;
  }

  serialize(): SerializedPlant {
    return {
      id: this.id,
      type: this.type,
      energy: this.energy,
      position: clonePosition(this.position),
      taken: this.taken,
    };
  }
}

