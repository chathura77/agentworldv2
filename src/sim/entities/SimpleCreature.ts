import { Creature, type CreatureArgs } from "./Creature";

export class SimpleCreature extends Creature {
  constructor(args: Omit<CreatureArgs, "kind"> & { kind?: "simple" | "intel" }) {
    super({ ...args, kind: args.kind ?? "simple" });
  }
}

