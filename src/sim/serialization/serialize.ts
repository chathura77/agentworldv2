import { World, type SerializedWorld } from "../core/World";

export function serializeWorld(world: World): SerializedWorld {
  return world.serialize();
}

export function deserializeWorld(snapshot: SerializedWorld): World {
  return World.deserialize(snapshot);
}

