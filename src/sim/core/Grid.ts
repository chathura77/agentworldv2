import {
  DIRECTION_VECTORS,
  clonePosition,
  type Direction,
  type Position,
} from "../entities/types";

export class Grid {
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    if (width < 1 || height < 1) {
      throw new Error("Grid dimensions must be positive");
    }
    this.width = Math.floor(width);
    this.height = Math.floor(height);
  }

  contains(position: Position): boolean {
    return (
      position.x >= 0 &&
      position.y >= 0 &&
      position.x < this.width &&
      position.y < this.height
    );
  }

  clamp(position: Position): Position {
    return {
      x: Math.max(0, Math.min(this.width - 1, Math.floor(position.x))),
      y: Math.max(0, Math.min(this.height - 1, Math.floor(position.y))),
    };
  }

  move(position: Position, direction: Direction): Position {
    const vector = DIRECTION_VECTORS[direction];
    return this.clamp({
      x: position.x + vector.dx,
      y: position.y + vector.dy,
    });
  }

  ahead(position: Position, facing: Direction, range = 1): Position[] {
    const vector = DIRECTION_VECTORS[facing === "stay" ? "east" : facing];
    const visible: Position[] = [clonePosition(position)];
    let cursor = clonePosition(position);

    for (let i = 0; i < range; i += 1) {
      cursor = this.clamp({ x: cursor.x + vector.dx, y: cursor.y + vector.dy });
      visible.push(clonePosition(cursor));
    }

    return visible;
  }
}

