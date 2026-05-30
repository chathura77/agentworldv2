\# AGENTS.md



\## Project intent



This project revives an old Java Swing/AWT “Agents in a Grid World” university assignment as a modern web simulation.



The old Java implementation is the behavioral reference. Preserve it in `legacy/` or `reference/`. Do not delete old source files.



\## Working rules



\- Preserve original behavior in Classic Mode unless the old code is clearly broken.

\- Add new behavior only through Advanced Mode or clearly named optional configuration.

\- Keep simulation logic independent from rendering and React.

\- Prefer deterministic seeded randomness for all simulation behavior.

\- Keep tunable values in centralized config files.

\- Document any behavior that differs from the old Java code.

\- Add or update tests when changing simulation rules.

\- Run typecheck and tests before considering work complete.



\## Preferred stack



\- TypeScript

\- Vite

\- React

\- PixiJS/WebGL or another high-performance browser renderer if justified

\- Vitest for simulation-core tests



\## Done criteria for code changes



A change is not complete until:



\- The app builds.

\- Simulation tests pass.

\- TypeScript has no errors.

\- README or docs are updated when behavior changes.

\- Classic Mode remains available.

\- Advanced Mode features are isolated behind mode/config flags.

