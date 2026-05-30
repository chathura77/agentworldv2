import type { CreatureArgs, SerializedCreature } from "./Creature";
import { SimpleCreature } from "./SimpleCreature";
import type { CreatureMemory, PlantMemory } from "../ai/memory";
import type { ComboType } from "./types";

export interface SerializedIntelCreature extends SerializedCreature {
  plantMemory: PlantMemory[];
  creatureMemory: CreatureMemory[];
  desiredPlantId: string | null;
  desiredCombo: ComboType | null;
  partnerId: string | null;
  leaderId: string | null;
  requestedPlantId: string | null;
  groupId: string | null;
  groupMemberIds: string[];
}

export class IntelCreature extends SimpleCreature {
  plantMemory: PlantMemory[] = [];
  creatureMemory: CreatureMemory[] = [];
  desiredPlantId: string | null = null;
  desiredCombo: ComboType | null = null;
  partnerId: string | null = null;
  leaderId: string | null = null;
  requestedPlantId: string | null = null;
  groupId: string | null = null;
  groupMemberIds: string[] = [];

  constructor(args: Omit<CreatureArgs, "kind">) {
    super({ ...args, kind: "intel" });
    this.mode = "observing";
  }

  get isLeader(): boolean {
    return this.groupMemberIds.length > 0;
  }

  get isPartner(): boolean {
    return this.leaderId !== null;
  }

  clearRelationship(): void {
    this.partnerId = null;
    this.leaderId = null;
    this.requestedPlantId = null;
    this.groupId = null;
    this.groupMemberIds = [];
    if (this.alive) {
      this.mode = this.plantMemory.length > 0 ? "pursuing" : "observing";
    }
  }

  override serialize(): SerializedIntelCreature {
    return {
      ...super.serialize(),
      plantMemory: this.plantMemory.map((entry) => ({ ...entry })),
      creatureMemory: this.creatureMemory.map((entry) => ({ ...entry })),
      desiredPlantId: this.desiredPlantId,
      desiredCombo: this.desiredCombo,
      partnerId: this.partnerId,
      leaderId: this.leaderId,
      requestedPlantId: this.requestedPlantId,
      groupId: this.groupId,
      groupMemberIds: [...this.groupMemberIds],
    };
  }
}
