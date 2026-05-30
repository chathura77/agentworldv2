# Simulation Rules

## Classic Mode Baseline

- The simulation is cell-based. The legacy 500x500 pixel world maps to a 5x5
  grid because Java drew cells every 100 pixels.
- `World.step(deltaTicks)` is deterministic for a fixed seed.
- Plants are maintained at `targetPlantPopulation`. Missing plants spawn in
  clustered plant sets of up to `plantSetMaxSize`.
- Classic plant selection preserves the Java bias where green is selected for
  rolls `0` and `1`.
- Plant energy values default to green `100`, red `50`, yellow `70`, magenta
  `90`.
- Combination energy values default to green+red `450`, yellow+red `420`,
  magenta+yellow `400`.
- Simple creatures see and pick up plants in their current cell only.
- Creatures eat when their energy is below `hungerThreshold`.
- Creatures prefer combinations before individual plants.
- Moving and staying have separate energy costs. This follows the documented
  rule and intentionally fixes the Java comparison bug that made staying behave
  like moving in most cases.
- Intel creatures see their current cell and one cell ahead in their facing
  direction. This follows the README and intentionally fixes the Java range
  precedence bug.
- Intel creatures remember visible plants and creatures up to configured limits.
- Intel creatures start in observation mode and leave it after remembering more
  than one plant.
- Intel creatures can share inventory combinations with other Intel creatures in
  the same cell.
- Intel creatures can create one leader/partner pair around a desired plant. A
  creature cannot join a new pair while already partner or leader.
- Partnerships terminate when the shared task completes, the partner dies, or
  the desired plant disappears.

## Advanced Mode Direction

Advanced Mode keeps the same world, plant, creature, inventory, memory, and
relationship concepts, then enables richer systems through configuration:

- terrain and fertility maps,
- seasonal plant weighting,
- local resource depletion and regeneration,
- memory confidence decay,
- weighted pathfinding,
- utility-scored target and partner choices,
- explicit communication message types,
- bounded leader-managed groups,
- configurable personality traits.

Current Advanced Mode behavior in the TypeScript core includes deterministic
fertility maps, seasonal spawn and energy variation, memory confidence decay,
utility-scored intel plant selection, fertility-aware pursuit routing, and
configurable strategy weights that bias cooperation, scouting, memory trust,
risk tolerance, and reserve conservation.
