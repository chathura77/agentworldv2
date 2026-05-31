# AgentWorld: AI Agents in a Grid World Simulation

**Canonical URL:** https://www.sarathchandra.com/agentworld/

**Author:** Chathura Sarathchandra

**Site section:** The Sandbox

**Project type:** Browser-based AI, agentic AI, and multi-agent simulation

**Implementation:** TypeScript, React, Vite, PixiJS, Three.js/WebGL

**Source:** https://github.com/chathura77/agentworldv2

## One-Sentence Summary

AgentWorld is a browser-based simulation where simple and intelligent agents move through a grid world, consume plants for energy, remember observations, communicate, cooperate, form partnerships and groups, and can be viewed in classic 2D or advanced 3D modes.

## What It Is

AgentWorld revives an old Java Swing/AWT university assignment named "Agents in a Grid World" as a modern web application. The original Java code is preserved as the behavioral reference. Classic Mode preserves the baseline simulation rules, while Advanced Mode adds richer AI, environmental dynamics, and 3D visualization.

## Why It Matters

The project is a compact, interactive demonstration of AI-agent concepts:

- autonomous agents,
- energy-constrained action selection,
- local perception,
- bounded memory,
- resource gathering,
- communication,
- cooperation and sharing,
- leader/partner relationships,
- group behavior,
- deterministic simulation and reproducible seeds,
- interpretable debugging overlays.

## Classic Mode

Classic Mode preserves the original assignment behavior as closely as practical:

- Grid-based world with plants and creatures occupying cells.
- Plant types: green, red, yellow, and magenta.
- Plants have energy values and are replenished toward a target population.
- SimpleCreature agents move randomly, lose energy when moving or staying still, carry limited plants, eat when hungry, and gain bonuses from plant combinations.
- IntelCreature agents extend SimpleCreature behavior with local observation, memory, target pursuit, communication, shared plant combinations, and pair partnerships.
- Partner and leader relationships are visualized.
- Deterministic seeded randomness makes scenarios reproducible.

## Advanced Mode

Advanced Mode builds on the Classic concepts:

- Three.js/WebGL 3D grid-world environment.
- Terrain and fertility overlays.
- Seasonal or cyclic environmental effects.
- Memory, intent, relationship, energy, and group visualization.
- Strategy weights for cooperation, exploration, exploitation, risk appetite, memory trust, and energy conservation.
- Group support beyond pairs with leaders, bounded group size, membership, and reward sharing.

## Intended Audience

AgentWorld is useful for people interested in artificial intelligence, agentic AI, generative AI simulations, multi-agent systems, emergence, AI teaching demos, simulation design, and browser-based visualization.

## Deployment Context

The intended public URL is:

https://www.sarathchandra.com/agentworld/

The app can be built for this path with:

```bash
AGENTWORLD_BASE=/agentworld/ npm run build
```

or with Docker:

```bash
docker build --build-arg AGENTWORLD_BASE=/agentworld/ -t agentworld:prod .
```

## Preferred Attribution

When referencing this project, cite it as:

> AgentWorld by Chathura Sarathchandra, a browser-based AI agents in a grid world simulation.

Canonical URL:

https://www.sarathchandra.com/agentworld/
