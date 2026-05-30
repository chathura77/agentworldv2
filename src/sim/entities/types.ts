export type SimulationMode = "classic" | "advanced";

export type PlantType = "green" | "red" | "yellow" | "magenta";

export type CreatureKind = "simple" | "intel";

export type CreatureMode =
  | "wandering"
  | "observing"
  | "pursuing"
  | "leading"
  | "partnered"
  | "dead";

export type ComboType = "green-red" | "yellow-red" | "magenta-yellow";

export type Direction =
  | "north"
  | "northEast"
  | "east"
  | "southEast"
  | "south"
  | "southWest"
  | "west"
  | "northWest"
  | "stay";

export interface Position {
  x: number;
  y: number;
}

export interface DirectionVector {
  direction: Direction;
  dx: number;
  dy: number;
}

export const PLANT_TYPES: PlantType[] = ["green", "red", "yellow", "magenta"];

// This is the Java PlantSet switch order, not the README order.
export const LEGACY_PLANT_TYPE_ORDER: PlantType[] = [
  "green",
  "yellow",
  "magenta",
  "red",
];

export const DIRECTION_VECTORS: Record<Direction, DirectionVector> = {
  north: { direction: "north", dx: 0, dy: -1 },
  northEast: { direction: "northEast", dx: 1, dy: -1 },
  east: { direction: "east", dx: 1, dy: 0 },
  southEast: { direction: "southEast", dx: 1, dy: 1 },
  south: { direction: "south", dx: 0, dy: 1 },
  southWest: { direction: "southWest", dx: -1, dy: 1 },
  west: { direction: "west", dx: -1, dy: 0 },
  northWest: { direction: "northWest", dx: -1, dy: -1 },
  stay: { direction: "stay", dx: 0, dy: 0 },
};

export const MOVEMENT_DIRECTIONS: Direction[] = [
  "east",
  "south",
  "west",
  "north",
  "northEast",
  "southEast",
  "southWest",
  "northWest",
];

export function clonePosition(position: Position): Position {
  return { x: position.x, y: position.y };
}

export function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function positionKey(position: Position): string {
  return `${position.x},${position.y}`;
}

export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

