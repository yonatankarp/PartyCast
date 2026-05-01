import { z } from 'zod';
import { CombatantSchema } from './combatant';
import { DamageTypeSchema } from './primitives';

export const RunEventSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('dice-roll'),
    roundIndex: z.number().int().min(0),
    actorId: z.string().min(1),
    purpose: z.string().min(1),
    expression: z.string().min(1),
    rolls: z.array(z.number().int().min(1)),
    total: z.number().int(),
  }),
  z.object({
    kind: z.literal('action-taken'),
    roundIndex: z.number().int().min(0),
    actorId: z.string().min(1),
    actionId: z.string().min(1),
    targetIds: z.array(z.string()).default([]),
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
    outcome: z.enum(['victory', 'defeat', 'fled', 'success', 'failure', 'completed']),
  }),
]);
export type RunEvent = z.infer<typeof RunEventSchema>;

export const RunResultSchema = z.object({
  runId: z.string().min(1),
  seed: z.string().min(1),
  adventureId: z.string().min(1),
  partyId: z.string().min(1),
  outcome: z.enum(['victory', 'defeat', 'fled']),
  deaths: z.array(z.string()),
  nodePath: z.array(z.string().min(1)),
  events: z.array(RunEventSchema),
  finalParty: z.array(CombatantSchema),
  rounds: z.number().int().min(0),
});
export type RunResult = z.infer<typeof RunResultSchema>;

export const RunStateSchema = z.object({
  runId: z.string().min(1),
  currentNodeId: z.string().min(1),
  roundIndex: z.number().int().min(0),
  partyState: z.array(CombatantSchema),
});
export type RunState = z.infer<typeof RunStateSchema>;
