export { World, createClassicWorld, type SerializedWorld } from "./core/World";
export { Grid } from "./core/Grid";
export {
  DEFAULT_CONFIG,
  createSimulationConfig,
  type DeepPartial,
  type SimulationConfig,
} from "./config/defaultConfig";
export { Plant } from "./entities/Plant";
export { Creature } from "./entities/Creature";
export { SimpleCreature } from "./entities/SimpleCreature";
export { IntelCreature } from "./entities/IntelCreature";
export {
  createSimulationEvents,
  summarizeWorldEvents,
  type SimulationAction,
  type SimulationEvent,
} from "./inspection/eventLog";
export type {
  ComboType,
  CreatureKind,
  CreatureMode,
  Direction,
  PlantType,
  Position,
  SimulationMode,
} from "./entities/types";
