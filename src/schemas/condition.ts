import { z } from 'zod';

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

export const ConditionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  rules: z.array(z.string()).default([]),
});
export type Condition = z.infer<typeof ConditionSchema>;

export const ActiveConditionSchema = z.object({
  id: z.string().min(1),
  duration: z.string().optional(),
  sourceId: z.string().optional(),
});
export type ActiveCondition = z.infer<typeof ActiveConditionSchema>;
