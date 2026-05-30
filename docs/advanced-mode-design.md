# Advanced Mode Design

Advanced Mode should build on Classic Mode rather than replace it. The same
`World` instance can switch from `classic` to `advanced` through `setMode()`.
Existing creatures, plants, memories, inventory, and relationships remain in
place.

Advanced Mode's presentation target is a full 3D environment, not just a richer
2D overlay. Classic Mode remains the clean grid renderer. Advanced Mode uses
Three.js for terrain, realistic-ish creature bodies, plant meshes, lighting,
camera controls, relationship beams, memory markers, and environmental objects.

## Environmental Dynamics

- Add a terrain/fertility layer independent from rendering.
- Spawn plants with local fertility weighting.
- Deplete fertility when plants are taken.
- Regenerate fertility gradually.
- Add a seasonal cycle that changes plant spawn weights and optional effective
  energy multipliers.

Current implementation status:

- deterministic fertility maps can be enabled through Advanced Mode settings,
- fertility regrows in Advanced Mode and biases new plant-set base cells,
- seasons rotate from tick count and affect Advanced Mode plant type weighting,
- seasonal energy multipliers are applied when new plants spawn,
- memory confidence decay is now active for both plant and creature memories,
- intel target choice is now utility-scored in Advanced Mode,
- intel pursuit now prefers higher-fertility routes when that lowers total
  travel utility cost,
- advanced strategy weights now tune cooperation, exploration, exploitation,
  risk appetite, memory trust, and energy reserve from centralized config,
- deterministic share and partnership messages are captured in the simulation
  core, serialized with snapshots, and exposed to the shell for debugging.
- Advanced Mode leaders can now recruit bounded intel groups up to the
  centralized `advanced.groupSizeLimit`, with follower-chain movement and
  deterministic join/leave transcripts.

## Agent Dynamics

- Keep SimpleCreature intentionally simple.
- Let IntelCreature use weighted pathfinding when Advanced Mode is enabled.
- Add memory confidence decay instead of perfect remembered locations.
- Add strategy weights for cooperation, exploration, exploitation, risk,
  memory trust, and energy conservation.
- Expand pair relationships into bounded groups with a leader.

Current group behavior:

- Classic Mode remains pair-only.
- Advanced Mode lets an intel leader recruit additional free intel creatures on
  the same cell when they can contribute to the same desired combination.
- Followers trail behind the leader in group-member order.
- When the shared target disappears, a member dies, or the leader completes the
  combination, the whole group dissolves deterministically.

## Communication Protocol

Initial message names:

- `askInventory`
- `proposeShare`
- `acceptShare`
- `rejectShare`
- `requestPartnership`
- `acceptPartnership`
- `rejectPartnership`
- `joinGroup`
- `leaveGroup`

Messages should stay in the simulation core as plain data. Rendering can display
message effects, but must not drive behavior.

## 3D Rendering Hooks

The core exposes enough state for overlays without importing canvas, React, DOM,
Three.js, or Pixi:

- creature mode and target,
- energy and hunger state,
- plant and creature memory,
- partner, leader, and group IDs,
- fertility/resource data,
- selected creature serialization.

The renderer owns all visual-only effects such as bobbing agents, glow, orbit
camera, shadows, relationship beams, and environmental scenery. These effects
must never mutate simulation rules.
