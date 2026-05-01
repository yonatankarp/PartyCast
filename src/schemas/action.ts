import { z } from 'zod';
import { AbilityScoreSchema, ResourceKeySchema, TagSchema } from './primitives';
import { EffectSchema } from './effect';

const ActionCostSchema = z.object({
  kind: z.enum(['action', 'bonus-action', 'reaction', 'free', 'movement', 'no-action']),
});

// Uses z.discriminatedUnion (not z.union like EffectSchema) because target
// shapes don't recurse, so the lazy-recursion constraint that forced union
// in effect.ts doesn't apply. Discriminated union gives precise path-aware
// errors like `target.length: Required` for a malformed cone.
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
  // min(1) is load-bearing: actions are matched to personas by tag, so an
  // action with no tags is unreachable content. Don't loosen to .default([]).
  tags: z.array(TagSchema).min(1),
  cost: ActionCostSchema,
  resourceCost: z
    .array(z.object({ resource: ResourceKeySchema, amount: z.number().int().positive() }))
    .superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.resource)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate resource key "${item.resource}"`,
            path: [index, 'resource'],
          });
        }
        seen.add(item.resource);
      });
    })
    .default([]),
  target: TargetShapeSchema,
  attack: AttackSchema.nullable(),
  effects: z.array(EffectSchema).min(1),
});
export type Action = z.infer<typeof ActionSchema>;
export type TargetShape = z.infer<typeof TargetShapeSchema>;
export type ActionCost = z.infer<typeof ActionCostSchema>;
export type Attack = z.infer<typeof AttackSchema>;
