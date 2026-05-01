# PartyCast Phase 2: Engine - Basic Combat (no reactions, no spells, no conditions) - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Phase 1 schemas executable. After Phase 2 lands, `runCombat({ encounter, party, monsters, seed }) -> RunEvent[]` deterministically resolves a single Combat node end-to-end. Same seed reproduces identical event stream across machines.

**Approach:** All engine code is pure functions or seeded-PRNG-stateful helpers. Engine never imports React, IndexedDB, or any UI layer. Every combat decision routes through a persona evaluator (5 predicates implemented; 7 deferred with explicit "not implemented in Phase 2" throws). Monsters use a hardcoded default persona until persona authoring expands beyond V1.

**Tech Stack:** No new runtime deps. Vitest for unit + integration tests. Engine code under `src/engine/`.

**Schema patch (prerequisite, shipped before this plan executes):** A small Phase-1 patch adds `'stuck'` to `RunResult.outcome` so Monte Carlo can treat runs that hit the round-cap as a distinct data point rather than a defeat or a crash. This lands in a separate prep PR alongside this plan document so Phase 2's implementation PR is engine-only.

---

## Scope boundaries

### In scope (Phase 2)
- Seedable PRNG (xoshiro256** or similar pure JS PRNG)
- Dice expression evaluator (`DiceExpressionSchema` strings)
- Grid geometry: distance, range-checking, occupancy/footprint, line-of-sight (line-of-sight is approximated with a basic Bresenham + cover lookup; full vis is V2)
- Initiative + turn loop + action economy (action / bonus action / reaction-slot-tracking-only / movement budgets)
- Attack roll resolver (d20 + mod vs AC, advantage/disadvantage)
- Saving throw resolver (d20 + save vs DC, advantage/disadvantage)
- Damage application with resistance / immunity / vulnerability
- Heal application with maxHp clamping
- Resource cost deduction
- Movement (path step-by-step, range-checked, blocked by occupied cells; no OAs)
- Effect dispatcher: handles `damage` / `heal` / `resource-cost` / `movement`; throws on `apply-condition` / `remove-condition` / `save-or-suck`
- Persona evaluator with 5 predicates + fallback heuristic
- Default monster persona (`basic-attack-closest-enemy`)
- Encounter outcome detection (victory / defeat / fled)
- Determinism tests

### Deferred (Phase 3+)
- Conditions tracker, condition application from effects (Phase 3)
- Resource manager, rest engine (Phase 3)
- Reactions event-bus, opportunity attacks, counterspell, shield, sentinel (Phase 4)
- Spells, AoE geometry, save-or-suck effects (Phase 4)
- 7 deferred persona predicates: `ally-hp-pct-below`, `enemies-in-burst-gte`, `self-concentrating`, `self-has-resource`, `slot-available`, `target-has-condition`, `party-has-role` (each phase that lands the dependency unblocks one or more)
- Per-monster persona authoring (current plan: hardcoded default persona for all monsters; spec-level discussion deferred)
- Multi-encounter resource attrition (handled at the AdventureRunner layer in Phase 6)

---

## Architecture rules

1. **Pure functions where possible.** Take state + inputs, return a new state object + an event list. Never mutate inputs.
2. **PRNG injection.** Every function that needs randomness takes a `Rng` parameter. No module-level random state. PRNG state advances via the function returning the new state alongside the random value (or via a class with a stable `next()` method).
3. **Engine has zero UI/persistence imports.** Only `zod`, `src/schemas/`, and other `src/engine/` modules.
4. **Determinism is load-bearing.** Same `(encounter, party, monsters, masterSeed)` always produces identical `RunEvent[]`. Tested explicitly.
5. **Effects and predicates dispatch via discriminated union exhaustiveness.** TypeScript enforces that every `kind` is handled (or explicitly marked deferred via a `never`-typed throw).
6. **No optimization until measured.** If a hot loop emerges, it gets benchmarked first. Phase 2 prioritizes clarity.
7. **Engine state is stored in a single `CombatState` value passed by reference between functions.** Mutation discipline: only specific helpers (e.g., `applyDamage(state, id, dmg)`) modify it; they return the new state, the caller replaces the old reference.
8. **The combat loop emits `RunEvent[]` continuously.** Aggregation, replay, and statistics are downstream concerns (Phase 8).

---

## File structure produced by this plan

```text
src/
  engine/
    __tests__/
      attack.test.ts
      combat-loop.test.ts
      combatant-state.test.ts
      damage.test.ts
      determinism.test.ts
      dice.test.ts
      effects.test.ts
      grid.test.ts
      heal.test.ts
      initiative.test.ts
      monster-persona.test.ts
      movement.test.ts
      persona.test.ts
      rng.test.ts
      run-combat.test.ts
      save.test.ts
      turn.test.ts
    attack.ts
    combat-loop.ts
    combat-state.ts            # CombatState type + helpers
    combatant-state.ts         # Combatant mutation helpers (applyDamage, applyHeal, deductResource, setPosition)
    damage.ts
    dice.ts
    effects.ts
    grid.ts
    heal.ts
    index.ts                   # barrel re-export
    initiative.ts
    monster-persona.ts
    movement.ts
    persona.ts                 # PersonaEvaluator + 5 predicates + fallback heuristic
    rng.ts
    run-combat.ts
    save.ts
    turn.ts
docs/
  superpowers/
    specs/2026-05-01-dnd-adventure-simulator-design.md  (already committed)
    plans/2026-05-01-phase-1-scaffolding-and-schemas.md (already committed)
    plans/2026-05-01-phase-2-engine-basic-combat.md     (this file)
```

---

## Task 1: Seedable PRNG

**Goal:** A PRNG that produces a deterministic stream of integers given a master seed string. Same seed -> same sequence across machines.

**Files:**
- Create: `src/engine/rng.ts`
- Create: `src/engine/__tests__/rng.test.ts`

**Algorithm:** xoshiro256** (or splitmix64-seeded equivalent). Pure JS, BigInt-based. State is four 64-bit unsigned integers; output is a 64-bit unsigned integer per call. We expose `nextInt(maxExclusive)` and `nextFloat()` (for [0,1)) on top of the raw stream.

**API sketch:**

```typescript
export interface Rng {
  nextInt(maxExclusive: number): number;
  nextFloat(): number;
  fork(label: string): Rng;
}

export function createRng(seed: string): Rng;
```

**Why `fork`:** sub-streams keyed by a label (e.g., `'combat:goblin-1:turn-3'`) so nested operations (a single attack rolling d20 + then damage) don't have ordering coupling that breaks under refactor. Implementation: hash `(parentState, label)` to seed a child Rng.

- [ ] **Step 1: Write failing tests**
  - Two `Rng`s created from the same seed produce identical sequences (first 100 values).
  - Two `Rng`s from different seeds diverge within the first 10 values (probabilistic; assert at least one differs).
  - `nextInt(n)` returns values in `[0, n)` for `n` in `[1, 1000]`.
  - `nextFloat()` returns values in `[0, 1)`.
  - `fork('label')` produces a stream independent of the parent (parent keeps advancing) but deterministic given the same parent state + label.

- [ ] **Step 2: Implement xoshiro256****
  - Use `BigInt` for 64-bit math. Output 64-bit unsigned, mask to 53 bits for `nextFloat` to avoid double-precision rounding artifacts.
  - Hash the seed string via FNV-1a or similar to seed splitmix64, then expand to 4 x u64 for xoshiro state.

- [ ] **Step 3: Verify all tests pass**

- [ ] **Step 4: Commit**

```bash
git add src/engine/rng.ts src/engine/__tests__/rng.test.ts
git commit -m "feat(engine): add seedable PRNG (xoshiro256**) with fork support"
```

---

## Task 2: Dice expression evaluator

**Goal:** Evaluate a `DiceExpression` string (e.g., `'3d6+2'`, `'1d20-1'`, `'4d6+12'`) using a `Rng`. Returns total + per-die rolls.

**Files:**
- Create: `src/engine/dice.ts`
- Create: `src/engine/__tests__/dice.test.ts`

**API:**

```typescript
import type { DiceExpression } from '../schemas';
import type { Rng } from './rng';

export interface DiceRoll {
  expression: DiceExpression;
  rolls: number[];      // each individual die result
  modifier: number;     // signed flat modifier (the +N or -N)
  total: number;        // sum(rolls) + modifier
}

export function rollDice(expression: DiceExpression, rng: Rng): DiceRoll;
```

**Notes:**
- Schema already restricts dice to d4/d6/d8/d10/d12/d20/d100. Parser is a simple regex-extract: `[1-9]\d*d(4|6|8|10|12|20|100)([+-]\d+)?`.
- Per die: `rng.nextInt(sides) + 1` (results 1..sides).
- Total floor / ceil / advantage handling lives in callers (attack-roll resolver applies advantage; dice eval doesn't know about it).

- [ ] **Step 1: Write failing tests**
  - `rollDice('1d20', rng)` returns one roll in `[1, 20]`, modifier=0, total=rolls[0].
  - `rollDice('3d6+5', rng)` returns 3 rolls in `[1, 6]`, modifier=5, total=sum(rolls)+5.
  - `rollDice('1d4-1', rng)` returns one roll in `[1, 4]`, modifier=-1, total=rolls[0]-1.
  - Same `(expression, seed)` produces same `DiceRoll` (determinism cross-check).
  - Edge: `rollDice('1d100', rng)` produces `[1, 100]`.
  - Negative-total case: `rollDice('1d4-10', rng)` allowed (callers clamp to 0 for damage).

- [ ] **Step 2: Implement parser + roller**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/dice.ts src/engine/__tests__/dice.test.ts
git commit -m "feat(engine): add dice expression evaluator using seeded PRNG"
```

---

## Task 3: Grid geometry primitives

**Goal:** Distance, range-checking, occupancy, footprint coverage. Phase 2 grids are 2D integer-coordinate. Each cell is one 5-foot square.

**Files:**
- Create: `src/engine/grid.ts`
- Create: `src/engine/__tests__/grid.test.ts`

**API:**

```typescript
import type { Position, Size } from '../schemas';

// Chebyshev (king's move) for D&D 5e tactical grid.
export function gridDistance(a: Position, b: Position): number;

// Footprint: how many cells a creature of `size` occupies. Returns the cells
// covered when the creature is "anchored" at the given position (top-left for
// >Medium creatures).
export function footprintCells(anchor: Position, size: Size): Position[];

// Range check in feet: returns true if `from` is within `feetRange` of any
// cell in `targetFootprint`. (Each cell = 5 feet.)
export function withinRange(from: Position, targetFootprint: Position[], feetRange: number): boolean;

// Same-cell test: are these positions identical?
export function samePosition(a: Position, b: Position): boolean;

// Bresenham line for line-of-sight approximation. Returns the integer cells
// crossed between two positions, exclusive of endpoints.
export function lineCells(a: Position, b: Position): Position[];
```

**Footprint sizes:** Tiny=1x1, Small=1x1, Medium=1x1, Large=2x2, Huge=3x3, Gargantuan=4x4. (Per spec line 84.)

**Notes:**
- 5e uses Chebyshev distance for grid combat (diagonal = 1 square = 5ft). 5.5e variants exist but per the spec we follow the standard 5.5e PHB rule, which is Chebyshev.
- No line-of-sight occlusion logic in Phase 2; Bresenham helper is foundational only.

- [ ] **Step 1: Write failing tests**
  - `gridDistance({0,0}, {3,4}) === 4` (Chebyshev: max(|dx|, |dy|) = 4)
  - `gridDistance({0,0}, {0,0}) === 0`
  - `footprintCells({0,0}, 'medium').length === 1`; `footprintCells({0,0}, 'large').length === 4`
  - `withinRange({0,0}, footprintCells({3,3}, 'medium'), 15) === true` (15ft = 3 cells, distance to {3,3} is 3)
  - `withinRange({0,0}, footprintCells({4,4}, 'medium'), 15) === false`
  - `samePosition({1,2}, {1,2}) === true; samePosition({1,2}, {2,1}) === false`
  - `lineCells({0,0}, {3,3}).length === 2` (between, exclusive of endpoints)

- [ ] **Step 2: Implement**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/grid.ts src/engine/__tests__/grid.test.ts
git commit -m "feat(engine): add grid geometry primitives (distance, footprint, range, line)"
```

---

## Task 4: Combatant state helpers

**Goal:** Pure helpers that mutate a single combatant's runtime state. All return a new `Combatant` object (immutable update). This is the only module that knows how to mutate a `Combatant`.

**Files:**
- Create: `src/engine/combatant-state.ts`
- Create: `src/engine/__tests__/combatant-state.test.ts`

**API:**

```typescript
import type { Combatant, Condition, DamageType, Position, ResourceKey } from '../schemas';

// Apply raw damage (after resistance/immunity/vulnerability already calculated).
// Floors at hp=0; tempHp absorbs first then hp.
export function applyDamage(c: Combatant, amount: number): Combatant;

// Heal up to maxHp. tempHp untouched.
export function applyHeal(c: Combatant, amount: number): Combatant;

// Deduct from a resource pool. Returns the combatant with `resources[key].current` decremented.
// Throws if amount > current (caller must check availability first via `hasResource`).
export function deductResource(c: Combatant, key: ResourceKey, amount: number): Combatant;

export function hasResource(c: Combatant, key: ResourceKey, amount: number): boolean;

export function setPosition(c: Combatant, position: Position): Combatant;

export function addCondition(c: Combatant, condition: Condition): Combatant;
export function removeCondition(c: Combatant, conditionId: string): Combatant;

// Death-state check (for outcome detection).
export function isAlive(c: Combatant): boolean;  // hp > 0
export function isDead(c: Combatant): boolean;   // hp === 0
```

**Notes:**
- Damage clamps hp at 0. We don't track death-saving-throws or instant-death-from-massive-damage in Phase 2 (Phase 3 work).
- `addCondition` / `removeCondition` are scaffolded for Phase 3 use; Phase 2's effect dispatcher doesn't call them (the `apply-condition` effect throws). Tests cover the helper in isolation.

- [ ] **Step 1: Write failing tests**
  - `applyDamage` reduces hp; tempHp absorbs first
  - `applyDamage` clamps hp at 0
  - `applyHeal` clamps at maxHp
  - `deductResource` decrements; throws if over-spend
  - `hasResource` boolean check
  - `setPosition` updates position
  - `addCondition` / `removeCondition` round-trip
  - `isAlive` / `isDead` opposite booleans

- [ ] **Step 2: Implement**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/combatant-state.ts src/engine/__tests__/combatant-state.test.ts
git commit -m "feat(engine): add Combatant state helpers (damage/heal/resource/position/condition)"
```

---

## Task 5: Initiative roller

**Goal:** Roll initiative for a list of combatants (PCs + monsters). Returns a tie-broken order. Tiebreak by Dex score, then by id-alphabetical.

**Files:**
- Create: `src/engine/initiative.ts`
- Create: `src/engine/__tests__/initiative.test.ts`

**API:**

```typescript
import type { Combatant } from '../schemas';
import type { Rng } from './rng';

export interface InitiativeEntry {
  combatantId: string;
  roll: number;
  modifier: number;
  total: number;
}

export function rollInitiative(combatants: Combatant[], rng: Rng): InitiativeEntry[];
```

**Rules:**
- Each combatant rolls 1d20 + Dex modifier. Dex modifier = `floor((dex - 10) / 2)`.
- Sort descending by `total`. Tiebreak by Dex score (higher first). Final tiebreak by id (alphabetical) for determinism.
- Returns the full list in turn order.

- [ ] **Step 1: Write failing tests**
  - All combatants get an entry; ordering by total descending.
  - Tiebreak by Dex score then id alphabetically.
  - Same `(combatants, seed)` produces same initiative order.

- [ ] **Step 2: Implement**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/initiative.ts src/engine/__tests__/initiative.test.ts
git commit -m "feat(engine): add initiative roll with tiebreaks (Dex, id)"
```

---

## Task 6: Attack roll resolver

**Goal:** Resolve a single attack: d20 + mod vs target's AC. Supports advantage/disadvantage (placeholder for Phase 4 reactions).

**Files:**
- Create: `src/engine/attack.ts`
- Create: `src/engine/__tests__/attack.test.ts`

**API:**

```typescript
import type { Action, Attack, Combatant } from '../schemas';
import type { Rng } from './rng';

export type RollMode = 'normal' | 'advantage' | 'disadvantage';

export interface AttackResult {
  hit: boolean;
  critical: boolean;        // natural 20
  fumble: boolean;          // natural 1
  rolls: number[];          // 1 entry for normal, 2 for adv/disadv
  d20Used: number;          // the kept value
  attackBonus: number;      // ability mod + proficiency + bonus
  total: number;            // d20Used + attackBonus
  targetAc: number;
}

export function resolveAttackRoll(
  attacker: Combatant,
  attack: Attack,
  target: Combatant,
  rng: Rng,
  mode: RollMode = 'normal',
): AttackResult;
```

**Rules:**
- `attackBonus` = ability-modifier (per `attack.abilityMod`) + (proficient ? proficiency-by-level : 0) + `attack.bonus`.
  - Proficiency-by-level table (5.5e PHB): level 1-4 = +2, 5-8 = +3, 9-12 = +4, 13-16 = +5, 17-20 = +6. Monsters use level=1 (proficiency=+2) by default since `Combatant.level` is optional.
- d20 with adv: roll 2, take higher; disadv: roll 2, take lower.
- Natural 20 = critical hit (auto-hit, double damage dice in damage step).
- Natural 1 = fumble (auto-miss; no extra effect in Phase 2).

- [ ] **Step 1: Write failing tests**
  - Normal attack: total = d20 + bonus
  - Advantage: 2 rolls, takes higher; disadvantage takes lower
  - Crit on natural 20 (regardless of total vs AC)
  - Fumble on natural 1 (regardless of total vs AC)
  - Hit when total >= targetAc
  - Determinism: same seed reproduces

- [ ] **Step 2: Implement** (proficiency-by-level table inline)

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/attack.ts src/engine/__tests__/attack.test.ts
git commit -m "feat(engine): add attack roll resolver (d20 + mod vs AC, crit/fumble)"
```

---

## Task 7: Saving throw resolver

**Goal:** Resolve a single saving throw: d20 + save mod vs DC. Used by Phase 4 spells but lands here as a primitive for completeness.

**Files:**
- Create: `src/engine/save.ts`
- Create: `src/engine/__tests__/save.test.ts`

**API:**

```typescript
import type { AbilityScore, Combatant } from '../schemas';
import type { Rng } from './rng';
import type { RollMode } from './attack';

export interface SaveResult {
  success: boolean;
  rolls: number[];
  d20Used: number;
  saveBonus: number;
  total: number;
  dc: number;
}

export function resolveSavingThrow(
  defender: Combatant,
  ability: AbilityScore,
  dc: number,
  rng: Rng,
  mode: RollMode = 'normal',
): SaveResult;
```

**Rules:**
- `saveBonus` = `defender.saves[ability]` (already includes proficiency for those proficient).
- Adv/disadv: same as attack rolls.
- Natural 20 = auto-success; natural 1 = auto-fail (per 5.5e PHB).
- Phase 2 doesn't dispatch `save-or-suck` effects; this primitive is here for use by future effect handlers.

- [ ] **Step 1: Write failing tests** (mirror attack test structure)

- [ ] **Step 2: Implement**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/save.ts src/engine/__tests__/save.test.ts
git commit -m "feat(engine): add saving throw resolver"
```

---

## Task 8: Damage application with resistance/immunity/vulnerability

**Goal:** Given a typed damage amount and a defender, apply the right reduction/multiplier and update the combatant.

**Files:**
- Create: `src/engine/damage.ts`
- Create: `src/engine/__tests__/damage.test.ts`

**API:**

```typescript
import type { Combatant, DamageType } from '../schemas';

export interface DamageApplication {
  combatant: Combatant;
  appliedAmount: number;     // after resist/immune/vuln math
  rawAmount: number;         // before
  multiplier: 0 | 0.5 | 1 | 2;  // immune | resistant | normal | vulnerable
}

export function applyTypedDamage(
  defender: Combatant,
  rawAmount: number,
  damageType: DamageType,
): DamageApplication;
```

**Rules:**
- Immune (`damageImmunities` includes type): multiplier 0; appliedAmount = 0.
- Resistant (`damageResistances`): multiplier 0.5; appliedAmount = floor(rawAmount * 0.5).
- Vulnerable (`damageVulnerabilities`): multiplier 2; appliedAmount = rawAmount * 2.
- Combinations: immune > vulnerable > resistant (immunity wins). If both vulnerable and resistant in the same type (authoring error), reviewers/cross-validation should catch; engine here treats as normal (multiplier 1) and the combatant module logs a warning... actually no, no warnings in engine. Just resistant + vulnerable cancel to multiplier 1.
- `applyDamage` (Task 4) is then called with `appliedAmount`.

- [ ] **Step 1: Write failing tests**
  - Normal damage: appliedAmount === rawAmount
  - Resistance halves and floors
  - Immunity zeros
  - Vulnerability doubles
  - Resistant+vulnerable in same type cancel to normal
  - Crit handling lives in the caller (effect dispatcher doubles dice before calling); damage.ts is type-only

- [ ] **Step 2: Implement**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/damage.ts src/engine/__tests__/damage.test.ts
git commit -m "feat(engine): add typed damage application with resistance/immunity/vulnerability"
```

---

## Task 9: Heal application

**Goal:** Apply a heal amount to a combatant. Thin wrapper over `applyHeal` for symmetry with damage; emits the right event shape.

**Files:**
- Create: `src/engine/heal.ts`
- Create: `src/engine/__tests__/heal.test.ts`

**API:**

```typescript
import type { Combatant } from '../schemas';

export interface HealApplication {
  combatant: Combatant;
  appliedAmount: number;     // after maxHp clamping
  rawAmount: number;
  hpBefore: number;
  hpAfter: number;
}

export function applyTypedHeal(target: Combatant, rawAmount: number): HealApplication;
```

**Rules:**
- Heal can't take a combatant above maxHp.
- A dead combatant (hp === 0) cannot be healed by basic heal effects (per 5.5e: revivify-class spells are required). For Phase 2, `applyTypedHeal` on a dead target returns `appliedAmount = 0` and combatant unchanged. (Note: this is conservative; revivify can be added later as a special effect kind.)

- [ ] **Step 1: Write failing tests**
  - Normal heal: hpBefore + amount, clamped at maxHp
  - Dead combatant: heal returns 0 applied
  - Heal at full HP: 0 applied

- [ ] **Step 2: Implement**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/heal.ts src/engine/__tests__/heal.test.ts
git commit -m "feat(engine): add heal application with maxHp clamp and dead-combatant guard"
```

---

## Task 10: Movement (no opportunity attacks)

**Goal:** Move a combatant from current position toward a destination, respecting movement budget, blocked cells, and footprint. NO opportunity attacks (deferred to Phase 4).

**Files:**
- Create: `src/engine/movement.ts`
- Create: `src/engine/__tests__/movement.test.ts`

**API:**

```typescript
import type { Combatant, Position } from '../schemas';

export interface MovementPlan {
  combatantId: string;
  path: Position[];               // step-by-step, each cell adjacent to the prior
  feetUsed: number;               // 5 * path.length
  blocked: boolean;               // true if path got cut short
}

// Compute the path (greedy / direct, no pathfinding around obstacles in Phase 2).
// Stops if blocked by another combatant's footprint or terrain.
export function planMovement(
  combatant: Combatant,
  destination: Position,
  occupiedCells: Set<string>,     // 'x,y' strings of cells already occupied
  feetBudget: number,
): MovementPlan;
```

**Rules:**
- Greedy step-toward: each step picks the cell adjacent to current position that minimizes Chebyshev distance to destination, breaking ties by preferring cardinal over diagonal.
- A step is blocked if the destination cell is in `occupiedCells` (excluding the combatant's own current cells).
- `feetBudget = combatant.speed - feetAlreadyMovedThisTurn`; movement task takes the budget as input, doesn't track it.
- Phase 2 has no opportunity attack hooks. Path is just the geometric trace.

**Note:** Real D&D pathfinding is more complex (difficult terrain, half/full cover, jumping); Phase 2 ships the simplest correct version. Phase 4 adds OA hooks; later phases can add A* if needed.

- [ ] **Step 1: Write failing tests**
  - Move 1 step: path length 1, feetUsed 5
  - Blocked by occupied cell: path stops early, blocked = true
  - Insufficient budget: path stops at budget, blocked = false but partial
  - Move to current position: path = [], feetUsed = 0
  - Path is monotonic-toward-destination (every step reduces Chebyshev distance or stays same on tie-breaks)

- [ ] **Step 2: Implement** (greedy step-toward, no A*)

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/movement.ts src/engine/__tests__/movement.test.ts
git commit -m "feat(engine): add movement planner (greedy, no opportunity attacks)"
```

---

## Task 11: Effect dispatcher (Phase 2 subset)

**Goal:** Route an `Effect` from the schema's union to its handler. Phase 2 handles 4 of 7 kinds; the other 3 throw "deferred to Phase N" errors.

**Files:**
- Create: `src/engine/effects.ts`
- Create: `src/engine/__tests__/effects.test.ts`

**API:**

```typescript
import type { Effect } from '../schemas';
import type { CombatState } from './combat-state';
import type { Rng } from './rng';
import type { RunEvent } from '../schemas';

export interface EffectContext {
  sourceId: string;             // who's applying the effect
  targetIds: string[];          // who's receiving
  state: CombatState;
  rng: Rng;
  roundIndex: number;
  isCritical?: boolean;         // doubles damage dice
}

export interface EffectResult {
  state: CombatState;
  events: RunEvent[];
}

export function applyEffect(effect: Effect, ctx: EffectContext): EffectResult;
```

**Handler dispatch (exhaustive switch on `effect.kind`):**
- `damage` -> roll dice (doubled if `isCritical`), per target apply typed damage, emit `damage-dealt` and possibly `death` events
- `heal` -> roll dice, apply heal, emit `healed` event
- `resource-cost` -> deduct from source's resource pool, no event (cost is implicit in `action-taken`)
- `movement` -> currently treats as a self-move toward target's position with the given distance; emits no specific event in Phase 2 (movement events are emitted by the movement task, not by effects)
- `apply-condition`: `throw new Error('apply-condition effect requires Phase 3 condition tracker')`
- `remove-condition`: same throw, message references Phase 3
- `save-or-suck`: same throw, message references Phase 4 (save-or-suck is the recursive-effect kind that drives save-vs-effect spells)

**Notes on `movement` effect:**
- The `MovementEffect` schema captures forced/free movement triggered by an attack (e.g., shield bash pushes 5 feet). In Phase 2 this is a self-move on the target. Distance is non-negative (per the schema tightening); direction = `'forced'` means the effect chooses, `'free'` means target chooses (in Phase 2 we always choose forced direction = away from source).
- Path is computed via the movement task (Task 10).

- [ ] **Step 1: Write failing tests**
  - `damage` effect: target HP reduced, event emitted
  - `damage` with crit: dice doubled
  - `heal` effect: target HP increased
  - `resource-cost`: source's pool decremented
  - `movement` effect: target's position updated
  - `apply-condition` / `remove-condition` / `save-or-suck`: each throws with the expected Phase-N message

- [ ] **Step 2: Implement** (exhaustive switch; deferred kinds throw)

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/effects.ts src/engine/__tests__/effects.test.ts
git commit -m "feat(engine): add effect dispatcher (Phase 2 subset: damage/heal/resource-cost/movement)"
```

---

## Task 12: Persona evaluator + 5 predicates + fallback heuristic

**Goal:** Walk a persona's priority list, find the first matching rule, return the chosen action + target. Fall back to the spec's built-in heuristic if no rule matches.

**Files:**
- Create: `src/engine/persona.ts`
- Create: `src/engine/__tests__/persona.test.ts`

**API:**

```typescript
import type { Action, Combatant, Persona, PersonaCondition } from '../schemas';
import type { CombatState } from './combat-state';

export interface PersonaChoice {
  action: Action;
  targetId: string | null;       // null for self-targeted (e.g., dash, dodge)
  ruleIndex: number | null;      // -1 if fallback heuristic was used
}

export function pickAction(
  persona: Persona,
  selfId: string,
  state: CombatState,
  availableActions: Action[],
): PersonaChoice;
```

**Algorithm:**
1. For each rule in `persona.rules` (in order):
   - Evaluate `rule.condition` against state. If predicate not implemented, throw with Phase-N message.
   - If condition fails, continue to next rule.
   - Filter `availableActions` by `rule.actionMatch` (tag match or exact id).
   - Filter further by availability: source has the resources, action's range covers at least one valid target.
   - If candidate set non-empty: pick the first (or apply heuristic disambiguator), pick a target (highest-threat reachable for damage actions; self for self-effects), return.
2. If no rule fires: fallback heuristic = highest-EV basic attack on highest-threat reachable enemy. "EV" = expected damage = (hit-chance) * (avg damage) - simple approximation. "Highest-threat" = highest current HP among enemies in range.

**Phase 2 predicates implemented:**
- `always` -> always true
- `self-hp-pct-below` -> `selfHp / selfMaxHp < threshold`
- `enemies-in-melee-gte` -> count of enemies within 5 ft of self >= count
- `combat-round-eq` -> `state.roundIndex === round`
- `combat-round-gte` -> `state.roundIndex >= round`

**Phase 2 predicates deferred (each throws on call):**
- `ally-hp-pct-below` -> `'ally-hp-pct-below predicate requires Phase 5/6 party state queries'`
- `enemies-in-burst-gte` -> `'enemies-in-burst-gte predicate requires Phase 4 AoE geometry'`
- `self-concentrating` -> `'self-concentrating predicate requires Phase 3 concentration tracker'`
- `self-has-resource` -> `'self-has-resource predicate requires Phase 3 resource manager queries'`
- `slot-available` -> `'slot-available predicate requires Phase 3 spell slot logic'`
- `target-has-condition` -> `'target-has-condition predicate requires Phase 3 condition tracker'`
- `party-has-role` -> `'party-has-role predicate requires Phase 5 party metadata'`

**Action match resolution:**
- `kind: 'tag'` -> any action whose `tags` includes the matched tag
- `kind: 'action-id'` -> the action with the matching `id` (single match)

**Targeting:**
- For damage actions: highest-HP enemy in range. (Phase 2 simple heuristic; Phase 7 can refine.)
- For heal actions: lowest-HP ally in range. (NOT in Phase 2 because ally queries deferred — fallback to self.)
- For self-buffs: targetId = selfId.

- [ ] **Step 1: Write failing tests**
  - Empty rule list: throws (or returns fallback only? actually `PersonaSchema.rules.min(1)` so empty isn't valid, but the schema enforces this, not the evaluator)
  - First-rule match: returns matching action
  - Skip-when-no-action-matches: walks past a rule whose actionMatch yields nothing, evaluates next
  - Skip-when-resource-unavailable: walks past a rule whose action's resourceCost can't be paid
  - Fallback path: no rules match -> fallback heuristic returns basic-attack against highest-HP enemy
  - Each implemented predicate has a positive + negative case
  - Each deferred predicate throws with the expected Phase-N message
  - Determinism: same `(persona, state, actions, seed)` -> same `PersonaChoice`

- [ ] **Step 2: Implement** (one function per predicate, switch dispatcher)

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/persona.ts src/engine/__tests__/persona.test.ts
git commit -m "feat(engine): add persona evaluator (5 predicates + fallback heuristic; 7 deferred)"
```

---

## Task 13: Default monster persona

**Goal:** A hardcoded `Persona`-shaped value the engine constructs at combat-start and assigns to every monster combatant. Behavior: closest-enemy basic attack until dead.

**Files:**
- Create: `src/engine/monster-persona.ts`
- Create: `src/engine/__tests__/monster-persona.test.ts`

**API:**

```typescript
import type { Persona } from '../schemas';

export const DEFAULT_MONSTER_PERSONA: Persona;

// Helper to attach the default persona to monsters at combat-start.
export function withDefaultMonsterPersona(monsters: Combatant[]): Array<{ combatant: Combatant; persona: Persona }>;
```

**Persona shape:**

```typescript
{
  id: 'default-monster',
  name: 'Default Monster',
  description: 'Closest enemy, basic attack.',
  rules: [
    {
      condition: { kind: 'always' },
      actionMatch: { kind: 'tag', tag: 'weapon-attack' },
    },
  ],
}
```

The fallback heuristic in the persona evaluator picks the actual target (highest-HP enemy in range falls through to closest-reachable — refine in tests).

**Notes:**
- This is a Phase 2 stopgap. Phase 7 question: do monsters get authored personas in `CombatNode.monsters`? Schema gap noted earlier. This file dissolves into proper authoring or stays as the default-fallback when monsters lack authored personas.

- [ ] **Step 1: Write failing tests**
  - The constant validates against `PersonaSchema`
  - `withDefaultMonsterPersona([m1, m2])` returns 2 entries each carrying the default persona

- [ ] **Step 2: Implement**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/monster-persona.ts src/engine/__tests__/monster-persona.test.ts
git commit -m "feat(engine): add default monster persona (closest-enemy basic attack)"
```

---

## Task 14: Turn structure + action economy

**Goal:** Run a single combatant's turn. Pick action via persona, dispatch via effect dispatcher, update state, emit events. Track action-economy budgets (action / bonus / movement).

**Files:**
- Create: `src/engine/turn.ts`
- Create: `src/engine/__tests__/turn.test.ts`

**API:**

```typescript
import type { Combatant, Persona, RunEvent } from '../schemas';
import type { CombatState } from './combat-state';
import type { Rng } from './rng';

export interface TurnBudget {
  action: boolean;          // true if not yet used
  bonusAction: boolean;
  reaction: boolean;        // tracked but not consumed in Phase 2
  feetMoved: number;
}

export interface TurnResult {
  state: CombatState;
  events: RunEvent[];
}

export function runTurn(
  combatantId: string,
  persona: Persona,
  state: CombatState,
  rng: Rng,
): TurnResult;
```

**Algorithm (Phase 2):**
1. Initialize `TurnBudget` (action: true, bonus: true, reaction: true, feetMoved: 0).
2. Loop:
   - Call `pickAction(persona, combatantId, state, availableActions)`.
   - If returned action's `cost.kind === 'action'` and budget.action is false, filter that action out and re-ask the persona (or stop if no other action fires).
   - Same checks for 'bonus-action', 'movement' (compares feetMoved + action's movement-budget cost to combatant.speed), 'free', 'no-action'.
   - Roll attack (if action has `attack`), call effect dispatcher for the action's effects (with critical flag if attack rolled crit).
   - Spend the budget slot.
   - Emit `action-taken` event.
   - If no further usable action available (or persona returns nothing), break.
3. Return state + events.

**Phase 2 turn capacity:** 1 action + 1 bonus action + movement (up to `combatant.speed` feet) per turn.

This is enough to model real level-1+ combat patterns including:
- Two-Weapon Fighting: action = main-hand weapon attack, bonus action = off-hand weapon attack.
- Spellcasters: action = cast a leveled spell, bonus action = cast a cantrip with bonus-action casting time (e.g., Healing Word).
- Mobile combatants: move 30 ft, action attack, move another 0 ft (same budget).

**Deferred to a later phase:**
- **Extra Attack (level 5+ Fighter / Paladin / Ranger / Barbarian feature)** — "When you take the Attack action, you can attack twice instead of once." This requires class-feature wiring at the action-resolution layer; the V1 `Action` schema doesn't carry an `attacksPerAction` field. Phase 2 ships 1 attack per Action; level-5+ martial characters will under-perform until the class-feature pass lands. Document inline in `turn.ts`.
- Reactions (Phase 4): `cost.kind === 'reaction'` actions are filtered OUT of `availableActions` for Phase 2 (no reaction triggers exist).
- "Ready" actions / trigger-based actions (Phase 4 - reactions territory).

**Notes:**
- `cost.kind === 'movement'` is a movement-budget action (e.g., a charge action that uses 30 ft of movement); validates against `feetMoved`.
- `cost.kind === 'free'` and `'no-action'` always available; `'no-action'` is for passive abilities not invoked in Phase 2.
- Movement-as-positioning (move-toward-target before attacking) lives in the persona evaluator's targeting logic (Task 12) since deciding *where* to move is part of action selection, not turn dispatch. Movement-as-action-cost (Dash, charge) lives here in the turn loop.

- [ ] **Step 1: Write failing tests**
  - Single-attack turn: action used, action budget consumed, event emitted
  - Action + bonus action: same turn fires both (e.g., main-hand + off-hand)
  - Action + movement: move within attack range, then attack
  - Action-budget exhaustion: persona returns another action-cost action, action filtered, persona returns null, turn ends
  - Bonus-action only character: skips main action if no available action-cost option, uses bonus action
  - Crit applies to damage dispatch
  - Determinism

- [ ] **Step 2: Implement**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/turn.ts src/engine/__tests__/turn.test.ts
git commit -m "feat(engine): add turn runner with action-economy budget tracking"
```

---

## Task 15: Combat round loop

**Goal:** Run combat round-by-round until termination. Each round: every alive combatant takes a turn in initiative order. Termination = victory (no enemies alive), defeat (no PCs alive), or fled (engine-level signal not implemented in Phase 2 — for now only victory/defeat).

**Files:**
- Create: `src/engine/combat-loop.ts`
- Create: `src/engine/__tests__/combat-loop.test.ts`

**API:**

```typescript
import type { Combatant, Persona, RunEvent } from '../schemas';
import type { CombatState } from './combat-state';
import type { Rng } from './rng';

export interface CombatLoopResult {
  finalState: CombatState;
  events: RunEvent[];
  outcome: 'victory' | 'defeat' | 'stuck';
  rounds: number;
}

export function runCombatLoop(
  initialState: CombatState,
  personas: Map<string, Persona>,    // combatantId -> persona
  rng: Rng,
  maxRounds?: number,                // safety cap, default 200
): CombatLoopResult;
```

**Algorithm:**
1. Roll initiative on all alive combatants (Task 5).
2. For each round (until termination or maxRounds):
   - For each combatant in initiative order:
     - If dead, skip.
     - Call `runTurn(combatantId, personas.get(combatantId), state, rng.fork('round:N:turn:id'))`.
     - Append events.
     - Check termination: if all PCs dead -> defeat; if all monsters dead -> victory.
   - Increment roundIndex.
3. If `roundIndex >= maxRounds` without victory/defeat -> outcome = `'stuck'`. Return final state + events + outcome + round count.

**Notes:**
- "round-start" / "round-end" events not in the Phase 1 RunEvent schema. Skipped to keep scope tight - round boundaries can be reconstructed from `roundIndex` on existing events.
- `fled` outcome requires combatant intent to flee (engine signal); not implemented in Phase 2 since persona doesn't return "flee" today. Phase 7 may add a `flee` action.
- **`maxRounds` cap and `'stuck'` outcome:** When a combat fails to converge (both sides have only heal actions, or both sides have only out-of-range attacks they can't reach with), we hit the cap. Treat this as a failed Monte Carlo run (data point), not as a crash. The encounter runner (Task 16) propagates `'stuck'` into `RunResult.outcome`. Realistic 5e encounter durations: standard 3-7 rounds, boss fights 5-15, attrition / multi-wave 20+. Default cap of 200 is the "definitely stuck" bar - a legitimate combat finishing 200 rounds in is so unusual it's effectively always a balance bug or persona pathology. Callers (e.g., long attrition campaign tests) can pass a higher cap.
- The `'stuck'` value is added to `RunResult.outcome` in the prep PR alongside this plan document - already in place when Phase 2 starts.

- [ ] **Step 1: Write failing tests**
  - 1v1 combat: PC vs goblin, deterministic outcome at given seed
  - Multi-round combat: 4 rounds before resolution
  - PC TPK: outcome = defeat
  - Monsters all dead: outcome = victory
  - Stuck combat: pass `maxRounds: 5` with personas that can't reach each other; outcome = 'stuck', rounds = 5
  - Determinism: same seed reproduces

- [ ] **Step 2: Implement**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/combat-loop.ts src/engine/__tests__/combat-loop.test.ts
git commit -m "feat(engine): add combat round loop with initiative + termination"
```

---

## Task 16: Encounter runner (top-level entry)

**Goal:** The public entry point for Phase 2. Consumes a Combat node + a Party + a master seed, returns a `RunResult` (or partial — Phase 2 doesn't fill `nodePath` since there's no adventure-level orchestration yet).

**Files:**
- Create: `src/engine/run-combat.ts`
- Create: `src/engine/__tests__/run-combat.test.ts`

**API:**

```typescript
import type { CombatNode, Party, RunResult } from '../schemas';

export interface RunCombatInput {
  encounter: CombatNode;
  party: Party;
  monsters: Combatant[];           // already instantiated from CombatNode.monsters * count
  seed: string;
}

export function runCombat(input: RunCombatInput): RunResult;
```

**Algorithm:**
1. Build initial `CombatState` from inputs: place party at `partyStartPositions`, place monsters at their authored positions (or random unoccupied cells if no position).
2. Construct `personas` map: PC ids -> their attached persona; monster ids -> `DEFAULT_MONSTER_PERSONA`.
3. Run combat loop (Task 15).
4. Build `RunResult`:
   - `runId`: hash of `(encounterId, partyId, seed)` for stability
   - `seed`: input seed
   - `adventureId`: passed-through (Phase 2 doesn't have an Adventure context, so this comes from input)
   - `partyId`: from party
   - `outcome`: from loop result. The loop's `'stuck'` propagates directly to `RunResult.outcome` (the prep PR's schema patch enables this).
   - `deaths`: derived from death events
   - `nodePath`: `[encounter.id]` (single node in Phase 2)
   - `events`: from loop result + entry/exit `node-entered` / `node-exited` wrapping
   - `finalParty`: from final state's combatants list
   - `rounds`: from loop result
5. Validate the RunResult against `RunResultSchema` (the deaths/events consistency superRefine catches drift).

- [ ] **Step 1: Write failing tests**
  - End-to-end smoke test: small encounter (2 PCs vs 1 goblin), runs to completion, RunResult validates
  - Determinism: same input produces same RunResult (deep-equality on events)
  - Outcome propagates correctly
  - `deaths` matches death events (the schema's superRefine will catch this; test verifies the engine produces correct output)

- [ ] **Step 2: Implement**

- [ ] **Step 3: Verify**

- [ ] **Step 4: Commit**

```bash
git add src/engine/run-combat.ts src/engine/__tests__/run-combat.test.ts
git commit -m "feat(engine): add encounter runner (top-level Phase 2 entry point)"
```

---

## Task 17: Determinism integration test + index barrel

**Goal:** A fixed-seed integration test that runs a non-trivial encounter and asserts the resulting RunResult against a captured baseline. Plus a barrel for engine consumers.

**Files:**
- Create: `src/engine/index.ts`
- Create: `src/engine/__tests__/determinism.test.ts`
- Modify: `README.md` (note Phase 2 status)

**Index barrel content:**

```typescript
export * from './rng';
export * from './dice';
export * from './grid';
export * from './combatant-state';
export * from './initiative';
export * from './attack';
export * from './save';
export * from './damage';
export * from './heal';
export * from './movement';
export * from './effects';
export * from './persona';
export * from './monster-persona';
export * from './turn';
export * from './combat-loop';
export * from './run-combat';
```

**Determinism test approach:**
- Run a fixed encounter (e.g., a 2-fighter party vs 4 goblins) with a fixed master seed.
- Capture the resulting `RunResult.events` length, `outcome`, `rounds`, and the first/last 5 events.
- Assert these match the captured baseline. If the encoding ever drifts, the test fails loud and the change must be reviewed.
- Run the same encounter twice with the same seed; assert deep-equal RunResult.

- [ ] **Step 1: Write integration test** (uses real schemas, builds a Party + CombatNode, runs runCombat)

- [ ] **Step 2: Implement barrel**

- [ ] **Step 3: Update README**

Update README's Status section:

```markdown
## Status

Phase 2 complete: schemas + engine that runs basic combat to resolution
deterministically. No reactions, no spells, no conditions yet (Phases 3-4).
Engine, services, UI, and content beyond Phase 2 are upcoming - see
`docs/superpowers/specs/` and `docs/superpowers/plans/`.
```

- [ ] **Step 4: Verify all checks**
  - `npm run lint`
  - `npm run typecheck`
  - `npm test` (all tests across schemas + engine should pass)
  - `npm run build`

- [ ] **Step 5: Commit**

```bash
git add src/engine/index.ts src/engine/__tests__/determinism.test.ts README.md
git commit -m "feat(engine): add index barrel + determinism integration test; update README"
```

---

## Smoke test (post-merge, optional)

After Phase 2 merges to main:

```bash
git checkout main && git pull
nvm use && npm ci
npm run lint && npm run typecheck && npm test && npm run build
```

Expected: all green. The full suite should be ~250+ tests (177 from Phase 1 + ~75 from Phase 2's engine tests).

---

## Roadmap (subsequent phases - each gets its own plan when ready)

| Phase | Scope | Depends on |
|-------|-------|------------|
| 3 | Engine: condition tracker + resource manager + rest engine | Phase 2 |
| 4 | Engine: spells + AoE geometry + reactions event-bus (the hardest piece) | Phase 3 |
| 5 | Application services: character builder service + progression rules + random party generator | Phase 1 (schemas), can parallelize with Phases 2-4 |
| 6 | Application services: adventure runner + node resolvers | Phases 2-4 |
| 7 | Application services: persona evaluator extensions (remaining 7 predicates lift their throws as their dependencies land) + monster persona authoring | Phases 2-5 |
| 8 | Application services: Monte Carlo orchestrator + Web Worker pool | Phases 6, 7 |
| 9 | SRD 5.2 content authoring (data, no code) | Phase 1 (schemas); parallelizable per content category |
| 10 | UI: character builder | Phase 5 |
| 11 | UI: adventure editor + encounter editor (incl. grid map editor) | Phase 1 |
| 12 | UI: sim runner + stats dashboard + animated playback viewer | Phase 8 |
| 13 | UI: persona editor + library browser | Phases 1, 7 |
| 14 | Persistence: IndexedDB + ZIP import/export + share-via-URL | Phase 1 |

After Phase 2 ships, Phase 3 unblocks Phase 4 (the hardest single piece per the spec). Phase 5 / Phase 9 / Phase 11 / Phase 14 can still parallelize with Phases 3-4.

The persona evaluator's deferred predicates (Task 12 in this plan) get lifted progressively as Phases 3, 4, 5 land. Phase 7's scope shrinks to "remaining predicate implementations + monster persona authoring + richer DSL discussion."
