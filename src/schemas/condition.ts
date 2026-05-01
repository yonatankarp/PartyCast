import { z } from 'zod';
import { RuleTagSchema } from './primitives';

export const SRD_CONDITION_IDS = [
  'blinded',
  'charmed',
  'deafened',
  'exhaustion',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
] as const;
export type SrdConditionId = (typeof SRD_CONDITION_IDS)[number];

// `id` is intentionally a free string (not z.enum(SRD_CONDITION_IDS)) so
// homebrew conditions are first-class. Reference validity (does an
// `apply-condition` effect or active condition resolve in the catalog?) is
// enforced by cross-validation at content-load time, not at the schema layer.
export const ConditionDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  rules: z.array(RuleTagSchema).default([]),
});
export type ConditionDefinition = z.infer<typeof ConditionDefinitionSchema>;

// Instance of a condition currently affecting a combatant. `level` exists
// for stacking conditions like 5.5e exhaustion (1-6); other conditions
// leave it absent.
export const ConditionSchema = z.object({
  id: z.string().min(1),
  level: z.number().int().min(1).max(6).optional(),
  duration: z.string().optional(),
  sourceId: z.string().optional(),
});
export type Condition = z.infer<typeof ConditionSchema>;
