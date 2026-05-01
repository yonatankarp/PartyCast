import { z } from 'zod';
import { CombatantSchema } from './combatant';
import { DamageTypeSchema, DiceExpressionSchema } from './primitives';

export const RunEventSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('dice-roll'),
    roundIndex: z.number().int().min(0),
    actorId: z.string().min(1),
    purpose: z.string().min(1),
    expression: DiceExpressionSchema,
    rolls: z.array(z.number().int().min(1)),
    total: z.number().int(),
  }),
  z.object({
    kind: z.literal('action-taken'),
    roundIndex: z.number().int().min(0),
    actorId: z.string().min(1),
    actionId: z.string().min(1),
    targetIds: z.array(z.string().min(1)).default([]),
  }),
  z.object({
    kind: z.literal('damage-dealt'),
    roundIndex: z.number().int().min(0),
    targetId: z.string().min(1),
    amount: z.number().int().min(0),
    damageType: DamageTypeSchema,
    sourceId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('healed'),
    roundIndex: z.number().int().min(0),
    targetId: z.string().min(1),
    amount: z.number().int().min(0),
    sourceId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('condition-applied'),
    roundIndex: z.number().int().min(0),
    targetId: z.string().min(1),
    conditionId: z.string().min(1),
    sourceId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('condition-removed'),
    roundIndex: z.number().int().min(0),
    targetId: z.string().min(1),
    conditionId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('death'),
    roundIndex: z.number().int().min(0),
    combatantId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('node-entered'),
    roundIndex: z.number().int().min(0),
    nodeId: z.string().min(1),
  }),
  z.object({
    kind: z.literal('node-exited'),
    roundIndex: z.number().int().min(0),
    nodeId: z.string().min(1),
    // Flat union covers all node-kind outcomes: combat (victory/defeat/fled),
    // skill-check (success/failure), branch/rest/loot/travel/custom (completed).
    // The engine knows from nodeId which subset is meaningful for a given event.
    // Note: this is intentionally a superset of RunResult.outcome (which only
    // exposes the run-level summary) - do not unify them.
    outcome: z.enum(['victory', 'defeat', 'fled', 'success', 'failure', 'completed']),
  }),
]);
export type RunEvent = z.infer<typeof RunEventSchema>;

// `outcome` adds 'completed' to the combat-style trio so adventures ending on
// non-combat nodes (rest, loot, branch, travel, custom) have a valid outcome.
// `deaths` is a denormalized index over the death events in `events`; the
// superRefine below enforces consistency. Engine/aggregator code should
// expose a single helper that appends to both atomically (Phase 2).
// `finalParty` includes slain combatants - dead PCs/monsters carry hp <= 0.
// `events` is unbounded; a 10k-round adventure run can produce 100k+ events.
// Streaming/sampled aggregation is a Phase 2/3 concern (see spec performance
// targets).
export const RunResultSchema = z
  .object({
    runId: z.string().min(1),
    seed: z.string().min(1),
    adventureId: z.string().min(1),
    partyId: z.string().min(1),
    // 'stuck' = combat failed to converge within the engine's round cap.
    // Monte Carlo aggregation should treat this as a balance signal, not a defeat.
    outcome: z.enum(['victory', 'defeat', 'fled', 'completed', 'stuck']),
    deaths: z.array(z.string().min(1)),
    nodePath: z.array(z.string().min(1)),
    events: z.array(RunEventSchema),
    finalParty: z.array(CombatantSchema),
    rounds: z.number().int().min(0),
  })
  .superRefine((result, ctx) => {
    // Set equality (not multiset / sorted-array). Each combatant can only die
    // once, so a duplicated id in either list is itself event-stream
    // corruption. Future check (deferred to engine layer): every dead
    // combatant should have hp <= 0 in finalParty, but that requires holding
    // three structures in scope.
    const deathEventIds = result.events
      .filter((e): e is Extract<RunEvent, { kind: 'death' }> => e.kind === 'death')
      .map((e) => e.combatantId);
    const deathEventSet = new Set(deathEventIds);
    const deathsSet = new Set(result.deaths);
    if (deathEventSet.size !== deathEventIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'death events contain duplicate combatantId values',
        path: ['events'],
      });
    }
    if (deathsSet.size !== result.deaths.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'deaths contains duplicate combatantId values',
        path: ['deaths'],
      });
    }
    const sameSet =
      deathEventSet.size === deathsSet.size &&
      [...deathEventSet].every((id) => deathsSet.has(id));
    if (!sameSet) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `deaths (${result.deaths.join(',')}) must match the death-kind events (${deathEventIds.join(',')})`,
        path: ['deaths'],
      });
    }
  });
export type RunResult = z.infer<typeof RunResultSchema>;

// `seed` carried so a paused run can be resumed deterministically. PRNG
// step counter is omitted here; the engine will need to either replay
// events from history or carry the step alongside seed when implemented.
export const RunStateSchema = z.object({
  runId: z.string().min(1),
  seed: z.string().min(1),
  currentNodeId: z.string().min(1),
  roundIndex: z.number().int().min(0),
  partyState: z.array(CombatantSchema),
});
export type RunState = z.infer<typeof RunStateSchema>;
