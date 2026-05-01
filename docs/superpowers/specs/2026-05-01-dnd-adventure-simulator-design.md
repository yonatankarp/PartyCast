# D&D 5.5e Adventure Simulator — Design Spec

**Status:** draft, awaiting user review
**Date:** 2026-05-01
**Owner:** Yonatan Karp-Rudin

## Goal

Build a browser-based, client-only Monte Carlo simulator for D&D 5.5e adventures. The user authors a party and an adventure graph, configures per-character automated decision policies ("personas"), and runs thousands of simulated playthroughs to get statistics on outcomes — survival rate, branch frequencies, where parties die, resource curves, and so on. Initial personal target: simulating *Phandelver and Below* and similar low-level adventures, with extensibility to anything in the 2024 ruleset.

## Inspiration and difference

The combat engine is structurally similar to *BattleCast* (e4developer.com): pure TypeScript engine separated from UI, three execution modes (animated playback / instant resolution / Monte Carlo), tactical-grid combat with creature footprints and AoE geometry. Key extensions:

| Area | BattleCast | This project |
|------|-----------|--------------|
| Edition | 5e / SRD 5.1 | 5.5e / SRD 5.2 |
| Level cap | 1-10 | 1-20 |
| Reactions | opportunity attacks only | full event-bus (counterspell, shield, hellish rebuke, sentinel, ...) |
| Conditions | 10 | full 5.5e set (~15) |
| Death saves | not implemented | required |
| Multi-encounter resource attrition | explicitly out of scope | core |
| Combat AI | one tactical AI scaled by INT | per-character personas |
| Multiclass / subclasses | not mentioned | required |
| Adventure layer | none | adventure graph + branches + skill checks + rest decisions |
| Random party builder | no | yes, with "Surprise Me" at every level-up step |

## Constraints

- Client-only. No backend, no LLM, no network calls at runtime beyond static asset fetch.
- TypeScript end-to-end. React + Vite for UI. Single language for the codebase.
- Persistence: IndexedDB for working state; portable `.zip` (with `manifest.json`) for adventures, parties, custom content; URL-encoded ZIP for share-via-URL.
- Web Workers for parallel Monte Carlo (worker pool sized to `navigator.hardwareConcurrency`).
- 5.5e ruleset. SRD 5.2 (CC-BY 4.0) is the bundled content baseline. Non-SRD content is the user's responsibility, authored against the same schemas as an extension format.
- Engine targets every rule used by V1 content. Rare DMG-only rules (mass combat, sieges, strongholds, downtime crafting, sanity, lingering injuries) are deferred to V2 unless content requires them earlier.
- Browser support: latest two versions of Chrome, Firefox, Safari, Edge. Desktop only. No IE / no legacy browsers.
- Mobile, networked play, and real-time multiplayer are explicitly out of scope.

## Performance targets

Indicative, not contractual — actual numbers depend on adventure complexity:

- 1k Monte Carlo runs of a single mid-sized combat encounter: under 10s on a modern laptop.
- 1k Monte Carlo runs of a Phandelver-scale full adventure (≈15-20 nodes): under 60s.
- 10k runs: minutes-scale, acceptable as a "go make coffee" operation.
- Cold app load: under 3s on broadband (SRD bundle is the dominant payload — must be code-split or fetched on demand).
- Animated playback: 60fps on the grid for a single run, with adjustable step speed.

If any of these miss by an order of magnitude after V1 lands, the path is moving the engine hot loop to Rust/WASM (V2).

## Architecture

Five layers, top to bottom. Each layer depends only on layers below it.

### Layer 1 — UI (React + Vite)

- **Character Builder** — manual level-up wizard with "Surprise Me" randomize button at every choice point (species, class, subclass, ASI/feat, spell selection, equipment).
- **Adventure Editor** — graph editor (React Flow) for authoring adventure structure. Drag nodes, connect with edges, click a node to edit its details.
- **Encounter Editor** — per-node form. For Combat nodes this includes a grid map editor (place monsters, party start positions, terrain features, cover).
- **Persona Editor** — priority-list builder. Add ordered rules, configure conditions and action-tag matches.
- **Sim Runner** — configure N, kick off Monte Carlo, monitor progress.
- **Stats Dashboard** — charts and tables of aggregate run results (Recharts).
- **Library Browser** — browse/search SRD content and user content. Edit, clone, delete.
- **Animated Playback Viewer** — replay any individual run's event log step-by-step on the grid.

### Layer 2 — Application services (TypeScript)

- **Adventure Runner** — walks the adventure graph, dispatches each node to its resolver, evolves party state between nodes (HP, slots, hit dice, exhaustion, gold, XP).
- **Monte Carlo Orchestrator** — spawns workers, batches runs, aggregates `RunResult`s, reports progress to UI.
- **Persona Evaluator** — given persona + visible state, returns the chosen action by walking the priority list top-down and matching the first satisfied rule.
- **Character Builder Service** — applies progression rules to produce a `Combatant` JSON, given a sequence of choices (manual or random). Also handles level-up of an existing character.
- **Random Party Generator** — composes a party using Character Builder Service plus role-balance heuristics (tank / healer / damage / utility).

### Layer 3 — Engine (pure functions, deterministic, seedable RNG)

- **Combat Engine** — initiative, turn loop, action economy (action / bonus action / reaction / movement / free), attacks, saves, multi-attack, opportunity attacks, concentration. Reactions implemented via an event bus: every action publishes events (`onAttackRoll`, `onSpellCast`, `onDamageDealt`, ...), reactions subscribe with conditions and may interrupt or modify resolution.
- **Effect Resolver** — applies effect primitives to combatants: damage (typed, with resistance/immunity/vulnerability), heal, condition (apply/remove), resource cost, movement, force-save.
- **Condition Tracker** — full 5.5e condition set with trigger/expire rules, including exhaustion levels.
- **Resource Manager** — spell slots, uses-per-day, hit dice, recharge abilities (per-encounter dice rolls), exhaustion.
- **Rest Engine** — short rest (hit dice spend) and long rest (full slot/HP/exhaustion recovery per 5.5e rules).
- **Skill / Save Resolver** — ability checks, saving throws, group checks, contested checks.
- **Progression Rules** — class/subclass features per level, multiclassing prerequisites, ASI/feat selection rules, spell preparation/known calculations, starting equipment.
- **Dice / RNG** — seedable PRNG (xoshiro256** or similar). One seed per run; the seed plus the engine produces a fully replayable event log.
- **Grid Geometry** — 5ft squares; creature footprints (Tiny 1x1, Small/Medium 1x1, Large 2x2, Huge 3x3, Gargantuan 4x4); AoE shapes (cone, line, sphere, cube, cylinder); cover (none / half / three-quarters / full); range and reach.

### Layer 4 — Schemas (TypeScript types + Zod validators)

The spine. Every layer above depends on these. They are authored first, in a single careful pass, before any other engine work begins.

- `Combatant` — PCs and monsters share. Stats, abilities, current state, resources, position on grid, conditions, equipment.
- `Action` — a thing a Combatant can do. Has tags (`tag:healing`, `tag:aoe-damage`, `tag:control`, ...), resource cost, target shape, effects.
- `Effect` — engine primitive applied to combatants. Damage, heal, condition, resource, movement, save-or-suck.
- `Condition` — status effect with trigger and expiration rules.
- `Persona` — ordered list of priority rules `(condition, actionMatch)`. Conditions are predicates over visible state from a fixed predicate library; actionMatch is by tag or specific action ID. Fallback: highest-EV basic attack.
- `AdventureNode` — discriminated union of `Combat`, `SkillCheck`, `Branch`, `Rest`, `Loot`, `Travel`, `Custom`. Each carries node-specific config.
- `Adventure` — graph: nodes + edges. Edges are conditional transitions.
- `Party` — collection of `Combatant`s, each with an attached `Persona`.
- `Run` — in-progress simulation state.
- `RunResult` — completed run outcome (win/loss, deaths, branch path taken, event log, final state).

### Layer 5 — Persistence and bundled data

- **IndexedDB Storage** — working state: in-progress builds, drafts, recent simulation results.
- **Import / Export (ZIP)** — adventures, parties, custom content as portable `.zip` with `manifest.json` declaring kind, version, and dependencies.
- **SRD 5.2 Bundle** — classes, subclasses, spells, monsters, items, conditions, species, backgrounds, feats. Read-only seed loaded at boot.
- **Content Loader** — loads and validates SRD bundle and user content against schemas at boot. Malformed content fails loud; partial load is not allowed.

## Decision policy (personas) — detail

A persona is an ordered list of priority rules. Engine evaluates rules top-down; the first rule whose condition is satisfied **and** whose action match is currently available picks the action.

**Conditions** are drawn from a fixed predicate library:

- `ally.hp_pct < N`, `enemies_in_burst >= N`, `enemies_in_melee >= N`, `self.hp_pct < N`
- `self.concentrating == bool`, `self.has_resource(name) == bool`, `self.slots[lvl] >= N`
- `target.has_condition(c)`, `combat.round == N`, `party.has_role(role)`

**Action match** is by tag or by ID:

- Tags: `tag:healing`, `tag:aoe-damage`, `tag:single-target-damage`, `tag:control`, `tag:buff`, `tag:debuff`, `weapon-attack`, `dash`, `disengage`, ...
- Specific: `action:fireball`, `action:bless`.

**Fallback** if no rule matches: a built-in heuristic — highest-EV basic attack on highest-threat reachable enemy.

This is intentionally a *simple priority list*, not a DSL. A richer expression language (e.g., embedded JS) is a power-user feature deferred to V2.

**Action tagging discipline.** Every action authored in SRD 5.2 content must carry the correct tags or personas will silently fail to match. Tag taxonomy is defined as a const enum in the schema layer, and content validation rejects unknown tags.

## Adventure graph — node semantics

- **Combat** — encounter on a grid. Place monsters, set party start positions, terrain. Engine runs combat to resolution. Outcome = victory / defeat / fled, where "defeat" covers TPK and any other party-loses outcome (surrender, capture). Resources deducted from party state.
- **SkillCheck** — single or group ability check. DC and ability specified. Personas decide who attempts (or the author marks specific PCs). Outcome routes to different transitions.
- **Branch** — explicit narrative choice. Each option has a "preferred by personas matching X" predicate; the party's collective persona decides. Author can also weight options statically.
- **Rest** — short or long. Resources recover per 5.5e rules.
- **Loot** — distributes items to party members (configurable: random, even, or by class fit).
- **Travel** — time passes. Optional exhaustion check. Optional random encounter table roll → may insert a Combat node.
- **Custom** — escape hatch. Author provides a small JavaScript snippet that takes party state and returns a state delta + transition. Executed inside an isolated Web Worker with no DOM, no network, no storage access — only access to the engine's primitives. Treated as user-authored content; the user is responsible for trusting their own snippets. For one-off mechanics that don't fit other node types.

## Monte Carlo orchestration

- N runs configurable; defaults: 1k for fast feedback, 10k for thorough.
- Each run gets a unique seed derived from a master seed via deterministic hash. Reproducibility: same master seed reproduces same run set.
- Workers (`navigator.hardwareConcurrency`) take batches of runs from a queue, return `RunResult`s.
- Aggregator collects results, computes statistics, streams updates to UI.
- Animated playback: any `RunResult` includes the seed and event log; replay re-runs the engine deterministically to step through.

## Stats dashboard — V1 contents

- TPK rate.
- Per-character death rate.
- Encounter difficulty (average HP and slot loss per encounter).
- Branch frequencies (which option taken at each Branch node, per persona config).
- Resource curves over adventure timeline (HP, spell slots, hit dice).
- Death heatmap: which node killed parties, broken down by cause.
- All filterable by persona config.

Charts via Recharts.

## Testing strategy

- **Engine** — pure functions, seeded RNG. High unit-test coverage on combat rules, conditions, resource tracking, reactions, AoE geometry. Property-based testing for invariants (e.g., HP never negative, slots never below zero, conditions resolve in legal order).
- **Schemas** — Zod validation tests against SRD content samples and malformed inputs. SRD bundle as a whole must validate at build time.
- **Adventure Runner** — integration tests with synthetic adventures (single Combat, single Branch, multi-node path with rests).
- **Persona Evaluator** — golden tests: given persona + state, expected action ID.
- **Monte Carlo** — distribution tests: known scenarios converge to expected statistics within tolerance over N runs.
- **UI** — component tests + snapshot tests for the character builder and persona editor flows. Manual exploratory testing for the grid editor.
- **Determinism** — same master seed reproduces identical RunResult set across machines.

## Parallelization plan for the agent team

The schema layer is authored first, by one careful agent, in a single pass. Once schemas land, agents can parallelize:

- One agent per engine sub-module (Combat, Effect Resolver, Condition Tracker, Resource Manager, Rest Engine, Skill Resolver, Progression Rules, Grid Geometry, Dice/RNG).
- One agent per UI component family (Character Builder, Adventure Editor, Encounter Editor, Persona Editor, Sim Runner, Stats Dashboard, Library Browser, Animated Playback Viewer).
- One agent per SRD content category (classes, spells, monsters, items, conditions, species, backgrounds, feats). These are pure data authoring against schemas.
- One agent for the Monte Carlo Orchestrator + Web Worker pool.
- One agent for the Adventure Runner.
- One agent for the Persona Evaluator.

Schema correctness is gospel. If an engine agent finds a schema gap, the schema is updated by the schema agent first; engine agents do not edit schemas without coordination.

## Risks

- **Reactions are the hardest single feature.** Counterspell, shield, sentinel, hellish rebuke, opportunity attacks all interrupt or modify the normal turn flow. The event-bus design needs care; getting it wrong means re-architecting the engine. Allocate explicit prototyping time.
- **Action-tag discipline.** Personas silently fail to match if SRD content tags are inconsistent. Mitigation: tag taxonomy is a closed enum in schemas; content validation rejects unknown tags; tag coverage is part of CI.
- **Grid authoring UX.** Map editing inside the encounter editor needs prototyping early. If authoring is too painful, adventure authors won't use the tool.
- **Performance ceiling.** 10k full-adventure Monte Carlo runs over a complex graph with reactions could take many seconds to minutes. Acceptable for a playtesting tool. If unacceptable, the path is moving the hot loop to Rust/WASM (Option C from architecture brainstorming) — explicitly a V2 concern.
- **Scope realism.** "All rules in V1" includes DMG-only material that no SRD 5.2 content exercises. The pragmatic posture: engine is open to those rules but ships only what V1 content uses; adding mass combat / strongholds / sanity is a content-driven V2 ask.
- **5.5e SRD coverage.** SRD 5.2 includes one subclass per class, the SRD spell list, ~70 monsters, etc. Players wanting Battle Master fighters, Eldritch Knights, Sorcerer subclasses, etc. must author them in extension JSON. Document the extension format prominently.

## Out of scope (V1)

- Networked play, real-time multiplayer.
- Mobile (canvas grid impractical at phone size).
- LLM-driven anything.
- Backend.
- Adventure content under non-CC license. The app does not bundle WotC's published adventures; users author their own.
- Mass combat, vehicle/siege combat, strongholds, sanity, lingering injuries, downtime crafting (engine-extensible; deferred until content requires).
- Richer persona DSL (priority list with fixed predicates only).

## Open questions for V2

- Richer persona DSL for power users.
- DMG-only rule modules.
- Rust/WASM engine for higher Monte Carlo throughput.
- Exporting RunResults to CSV / JSON for offline analysis.
- "Compare two persona configs" diff view in stats dashboard.
- Levels 11-20 SRD-equivalent content beyond what SRD 5.2 ships.
- **`MovementEffect` direction encoding.** V1 schema uses `direction: 'forced' | 'free'` (who decides) and a signed `distance` (no bound). 5.5e mechanically distinguishes push (away from source), pull (toward source), shove (either, attacker chooses), and slide (any direction, attacker chooses). The V1 binary is sufficient to typecheck the schema but does not carry enough information for the engine to apply forced movement unambiguously. Expand to a discriminant (e.g. `kind: 'push' | 'pull' | 'slide' | 'free-move'`) before the combat engine implements forced movement, or before authoring SRD content that uses it.
