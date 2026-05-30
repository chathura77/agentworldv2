# AgentWorld Migration Report

## Original Source Reviewed

The original project was inspected from `README` and the Java sources under
`AgentWorld/src`. A preserved copy also lives under `legacy/AgentWorld/src`.

## Important Original Classes

- `WorldFrame`: Swing `JFrame` shell, sliders/text inputs, log area, creature and
  plant population watchers. It keeps the target plant count full by repeatedly
  creating `PlantSet` instances of up to four plants.
- `Grid`: Swing `JPanel` for drawing the 100px grid, static plant and creature
  repositories, add/remove helpers, and paint-time cleanup of dead creatures.
- `Plant`: plant type, color, energy amount, position, availability/taken state.
- `PlantSet`: creates a small random set of plants and positions them diagonally
  from a random base point.
- `PlantRunnable`: chooses the random base position for a plant set.
- `SimpleCreature`: base creature state, unique creature number, energy loop,
  inventory, plant pickup in the same grid square, random movement primitives,
  hunger behavior, and plant combination consumption.
- `SimpleCreatureRunnable`: random movement loop. The Java switch intentionally
  or accidentally falls through, so one chosen action can cascade into later
  movement actions until a timer stops it.
- `IntelCreature`: extends `SimpleCreature` with plant and creature memory,
  current desired plant/combo, communication, shared combinations, partner and
  leader state, special energy costs, and relationship colors.
- `IntelCreatureRunnable`: observation-mode movement, target selection from
  remembered plants, movement toward desired plants, waiting when inventory is
  full, and leader/partner following behavior.

## Original Simulation Rules Found In Code

- The world is a square pixel grid drawn as 100px cells. Defaults are 500x500
  pixels, so the legacy default is a 5x5 cell world.
- Plants and creatures can share cells. Multiple plants can exist in one cell.
- Default plant energy values are green `100`, red `50`, yellow `70`, and
  magenta `90`.
- Default plant combination values are green+red `450`, yellow+red `420`, and
  magenta+yellow `400`.
- Plant population is maintained at a target count. Deficits are filled in
  batches of up to four plants.
- The legacy plant type draw is biased: `Random.nextInt(NUM_OF_PLANT_TYPES + 1)`
  maps both `0` and `1` to green. For 4 enabled types, green is twice as likely
  as each other type. The switch order is green, yellow, magenta, red.
- Simple creatures start with energy `100`, hunger threshold `50`, inventory
  limit `4`, same-square plant vision, and unique IDs.
- Simple creature energy drains every energy tick. Intended costs are `7` after
  changing square and `5` when staying in the same square.
- Simple creatures eat when hungry. They prefer combinations in order
  combo one, combo two, combo three, then otherwise eat the first carried plant.
- Intel creatures inherit simple creature behavior but use default movement
  drain `15`, stay drain `10`, plant memory `20`, creature memory `20`, and
  inventory limit `4`.
- Intel creatures remember visible plants and creatures, start in observation
  mode, and keep observing until more than one plant has been seen.
- Intel creatures choose plants that complete combinations with carried plants,
  otherwise they can pursue remembered plants.
- Intel creatures on the same square can request shared inventory combinations.
  If accepted, both remove one plant from the matching pair and both gain double
  the normal combination amount.
- Intel creatures can form pair relationships. The requestor becomes partner;
  the target creature becomes leader. The leader pursues the desired plant and,
  when the matching combination completes, both creatures gain the shared reward.
- A partnership ends when the task completes, when the partner dies, or when the
  desired plant disappears before the leader can use it.
- A partner is rendered light yellow and a leader dark yellow in the Java UI.
- Current group behavior is only pair-based. The README describes larger
  leader-managed groups as future work.

## Unclear Or Buggy Behaviors

- `SimpleCreature.isSquareChanged()` compares the creature pixel position to the
  stored square origin instead of comparing current square to previous square.
  This usually charges moving cost even when the creature has not changed cells.
  Classic Mode implements the intended moved-vs-stayed rule because the comment,
  README, and tests all describe distinct costs.
- `IntelCreature.isInRange()` has operator precedence issues and no facing state.
  It can see any plant on the same row and adjacent rows in a wider pattern than
  "one square ahead". Classic Mode treats this as a bug and implements current
  square plus one square ahead using the creature's facing direction.
- `SimpleCreatureRunnable` uses `NUM_OF_MOVES = 6`, calls `nextInt(6)`, has a
  `case 6`, and omits `break` statements. The rendered Java movement therefore
  cascades through actions and never starts at case 6. The TypeScript core uses
  deterministic one-cell movement intents per tick.
- `IntelCreature.getComboAmount(COMBO_THREE)` returns combo two's amount. The
  TypeScript core uses the actual combo three constant.
- The partnership precheck in `watchCreatures()` uses `||` where the comment
  implies all creatures should be uncommitted. The later acceptance method is
  stricter. The TypeScript core uses the stricter acceptance rule.
- The yellow plant amount text field writes from the red plant text field in
  `WorldFrame`. This is not preserved.
- The Java implementation relies on many daemon threads and busy loops, so exact
  interleavings are not deterministic. The TypeScript version keeps the rules
  but makes `world.step(deltaTicks)` deterministic.

## Preserved In Classic Mode

- 5x5 default grid derived from the original 500x500 world with 100px cells.
- Four plant types, default plant energy values, and default combo energy values.
- Target plant population, replenished in plant sets of up to four.
- Legacy-biased plant type selection order and weighting.
- Plant set clustering from a random base position, translated into cell space.
- Simple creature random search, same-square pickup, hunger threshold, inventory
  limit, combination priority, and energy drain.
- Intel creature memory limits, observation mode, target selection from memory,
  same-square communication, shared combos, pair partnership, leader/partner
  state, target disappearance termination, and shared task rewards.
- Partner and leader status as first-class state for rendering.

## Enhanced In Advanced Mode

- Advanced Mode is designed as a toggle on the same simulation state, not a reset.
- Planned additions are modular terrain/fertility data, seasonal spawn weighting,
  memory confidence decay, A*/weighted movement, utility scoring, richer
  communication messages, bounded multi-creature groups, personality traits, and
  overlays for memory, fertility, energy, intent, and relationships.
- The first milestone includes the configuration and core seams needed for these
  features. Rendering and full Advanced Mode behavior will be layered in later
  milestones. The current Classic shell also exposes optional debug overlays for
  energy, fertility, memory, intent, and relationships without changing
  simulation rules.
- Advanced Mode now also uses the centralized `advanced.groupSizeLimit` setting
  to extend pair partnerships into bounded leader-managed groups. This does not
  affect Classic Mode behavior.
