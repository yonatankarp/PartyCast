import { z } from 'zod';
import { AbilityScoreSchema, ResourceKeySchema, TagSchema } from './primitives';
import { EffectSchema } from './effect';

const ActionCostSchema = z.object({
  kind: z.enum(['action', 'bonus-action', 'reaction', 'free', 'movement', 'no-action']),
});

const TargetShapeSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('single'), range: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('multiple'), count: z.number().int().positive(), range: z.number().int().nonnegative() }),
  z.object({ kind: z.literal('self') }),
  z.object({ kind: z.literal('cone'), length: z.number().int().positive(), range: z.number().int().nonnegative() }),
  z.object({
    kind: z.literal('line'),
    length: z.number().int().positive(),
    width: z.number().int().positive(),
    range: z.number().int().nonnegative(),
  }),
  z.object({
    kind: z.literal('sphere'),
    radius: z.number().int().positive(),
    range: z.number().int().nonnegative(),
  }),
  z.object({ kind: z.literal('cube'), side: z.number().int().positive(), range: z.number().int().nonnegative() }),
  z.object({
    kind: z.literal('cylinder'),
    radius: z.number().int().positive(),
    height: z.number().int().positive(),
    range: z.number().int().nonnegative(),
  }),
]);

const AttackSchema = z.object({
  abilityMod: AbilityScoreSchema,
  proficient: z.boolean(),
  bonus: z.number().int().default(0),
});

export const ActionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tags: z.array(TagSchema).min(1),
  cost: ActionCostSchema,
  resourceCost: z
    .array(z.object({ resource: ResourceKeySchema, amount: z.number().int().positive() }))
    .default([]),
  target: TargetShapeSchema,
  attack: AttackSchema.nullable(),
  effects: z.array(EffectSchema).min(1),
});
export type Action = z.infer<typeof ActionSchema>;
export type TargetShape = z.infer<typeof TargetShapeSchema>;
export type ActionCost = z.infer<typeof ActionCostSchema>;
export type Attack = z.infer<typeof AttackSchema>;
